from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import List, Optional
import chromadb
import httpx
import os

from app.database import get_db
from app.models import User
from app.dependencies import get_current_user
from app.config import settings

router = APIRouter(
    prefix="/api/chatbot",
    tags=["chatbot"]
)

class ChatMessage(BaseModel):
    sender: str
    text: str

class QueryRequest(BaseModel):
    message: str
    history: Optional[List[ChatMessage]] = []

class QueryResponse(BaseModel):
    response: str
    sources: List[str]

CHROMA_DIR = "chroma_db"
COLLECTION_NAME = "career_knowledge"

def get_chroma_collection():
    try:
        chroma_client = chromadb.PersistentClient(path=CHROMA_DIR)
        # Using default ONNX embedding function
        collection = chroma_client.get_collection(name=COLLECTION_NAME)
        return collection
    except Exception:
        # Collection might not exist yet if no docs were ingested
        return None

async def fetch_available_ollama_model() -> str:
    try:
        async with httpx.AsyncClient() as client:
            res = await client.get("http://localhost:11434/api/tags", timeout=3)
            if res.status_code == 200:
                models = res.json().get("models", [])
                if models:
                    return models[0]["name"]
    except Exception:
        pass
    return "llama3"

async def query_llm(prompt: str, context: str, history_str: str = "") -> str:
    # Systemic Career Guidance Instructions (Module 7: LLM Career Assistant)
    system_msg = (
        "You are the conversational AI Career Counselor for the platform. "
        "Your role is to help students with:\n"
        "1. Resume analysis (evaluating strengths, formatting, and projects)\n"
        "2. Career goal guidance (suggesting roles and pathways)\n"
        "3. Skill-gap explanation (defining what skills are missing to achieve target roles)\n"
        "4. Personalized learning-plan generation (recommending topics to learn in order)\n"
        "5. Interview/question assistance (providing practice interview questions and feedback)\n\n"
        "Ground your answers in the student's database profile and the provided knowledge base context. "
        "Be encouraging, structured, and clear. Format output nicely in markdown."
    )

    # 1. Check for OpenAI
    openai_key = os.getenv("OPENAI_API_KEY")
    if openai_key:
        try:
            headers = {
                "Authorization": f"Bearer {openai_key}",
                "Content-Type": "application/json"
            }
            user_content = f"Context information (Student Profile details & Vector Database guides):\n{context}\n\n"
            if history_str:
                user_content += f"Conversation history:\n{history_str}\n\n"
            user_content += f"Question: {prompt}"
            
            payload = {
                "model": "gpt-4o-mini",
                "messages": [
                    {"role": "system", "content": system_msg},
                    {"role": "user", "content": user_content}
                ],
                "temperature": 0.7
            }
            async with httpx.AsyncClient() as client:
                res = await client.post("https://api.openai.com/v1/chat/completions", headers=headers, json=payload, timeout=15)
                if res.status_code == 200:
                    return res.json()["choices"][0]["message"]["content"]
        except Exception as e:
            print(f"OpenAI query failed: {e}")

    # 2. Try Ollama (Llama 3 / Mistral with Dynamic Discovery)
    try:
        model_name = await fetch_available_ollama_model()
        full_prompt = f"Context information (Student Profile details & Vector Database guides):\n{context}\n\n"
        if history_str:
            full_prompt += f"Conversation history:\n{history_str}\n\n"
        full_prompt += f"Question: {prompt}"
        
        payload = {
            "model": model_name,
            "prompt": full_prompt,
            "system": system_msg,
            "stream": False
        }
        async with httpx.AsyncClient() as client:
            res = await client.post("http://localhost:11434/api/generate", json=payload, timeout=15)
            if res.status_code == 200:
                return res.json()["response"]
    except Exception:
        pass

    return ""

@router.post("/query", response_model=QueryResponse)
async def query_career_advisor(
    request: QueryRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    user_query = request.message.strip()
    if not user_query:
        raise HTTPException(status_code=400, detail="Query message cannot be empty")

    # 1. Query PostgreSQL for student profile information (to personalize RAG context)
    profile_context = ""
    student_name = current_user.full_name or "Student"
    
    if current_user.role == "student":
        from app.models import StudentProfile, ExtractedSkill, Project, Certification, SkillGapAnalysis
        
        student = db.query(StudentProfile).filter(StudentProfile.student_id == current_user.id).first()
        if student:
            student_name = student.full_name or student_name
            skills = db.query(ExtractedSkill).filter(ExtractedSkill.student_id == current_user.id).all()
            projects = db.query(Project).filter(Project.student_id == current_user.id).all()
            certs = db.query(Certification).filter(Certification.student_id == current_user.id).all()
            gaps = db.query(SkillGapAnalysis).filter(SkillGapAnalysis.student_id == current_user.id).all()
            
            skills_list = [s.skill_name for s in skills]
            projects_list = [p.title for p in projects]
            certs_list = [c.name for c in certs]
            gaps_list = [g.required_skill for g in gaps]
            
            profile_context = (
                f"Student Profile Context:\n"
                f"- Name: {student_name}\n"
                f"- CGPA: {student.cgpa or 'Not Provided'}\n"
                f"- Current Skills: {', '.join(skills_list) if skills_list else 'None specified yet'}\n"
                f"- Projects: {', '.join(projects_list) if projects_list else 'None listed'}\n"
                f"- Certifications: {', '.join(certs_list) if certs_list else 'None listed'}\n"
                f"- Active Skill Gaps to Bridge: {', '.join(gaps_list) if gaps_list else 'None detected'}\n"
            )

    # 2. Similarity search in local ChromaDB vector store
    collection = get_chroma_collection()
    retrieved_docs = []
    sources = []
    knowledge_context = ""

    if collection:
        try:
            results = collection.query(
                query_texts=[user_query],
                n_results=3
            )
            
            if results and results.get("documents") and results["documents"][0]:
                retrieved_docs = results["documents"][0]
                metadatas = results["metadatas"][0]
                
                for idx, doc in enumerate(retrieved_docs):
                    source = metadatas[idx].get("source", "Career Document")
                    sources.append(source)
                    knowledge_context += f"\n[Source: {source}]\n{doc}\n"
        except Exception as e:
            print(f"Chroma DB query warning: {e}")

    # Deduplicate sources
    sources = list(set(sources))

    # Format chat history context string
    history_str = ""
    if request.history:
        recent_history = request.history[-6:]
        history_str = "\n".join([f"{'Student' if m.sender == 'user' else 'Counselor'}: {m.text}" for m in recent_history])

    # 3. Combine both PostgreSQL profile details and ChromaDB vector search documents
    combined_context = ""
    if profile_context:
        combined_context += profile_context + "\n"
    if knowledge_context:
        combined_context += f"Knowledge Base Documents:\n{knowledge_context}\n"
    else:
        combined_context += "Knowledge Base Documents: No matching career guides found in RAG.\n"

    # Try querying the LLM
    if combined_context.strip():
        llm_response = await query_llm(user_query, combined_context, history_str)
        if llm_response:
            return QueryResponse(response=llm_response, sources=sources)

    # 4. Fallback response if LLMs are offline
    if retrieved_docs:
        response_text = f"Hello {student_name}! Here is what I found in our indexed career manuals matching your query:\n\n"
        for idx, doc in enumerate(retrieved_docs):
            source = sources[idx] if idx < len(sources) else "Guide Doc"
            response_text += f"**From {source}:**\n{doc.strip()}\n\n"
        if profile_context:
            response_text += f"**Based on your profile:**\n- Your active skills: {', '.join(skills_list) if skills_list else 'None'}\n- Skill gaps you need to bridge: {', '.join(gaps_list) if gaps_list else 'None'}\n\n"
        response_text += "*(To enable conversational AI counseling responses, please start your local Ollama server running llama3 or set up `OPENAI_API_KEY` inside `.env`)*"
    else:
        # Complete fallback when both Chroma is empty and LLMs are offline
        response_text = (
            f"Hello {student_name}! I am your AI Career Counselor.\n\n"
        )
        if profile_context:
            response_text += (
                f"Here is a summary of your profile stats from the database:\n"
                f"- **Active Skills:** {', '.join(skills_list) if skills_list else 'None'}\n"
                f"- **Skill Gaps:** {', '.join(gaps_list) if gaps_list else 'None'}\n"
                f"- **Projects:** {', '.join(projects_list) if projects_list else 'None'}\n\n"
            )
        response_text += (
            "**To activate smart RAG answers:**\n"
            "1. Drop career documents (like PDF guides or syllabus files) inside the `backend/data/` folder.\n"
            "2. Run the indexing script to build your vector database:\n"
            "   `python -m app.scripts.ingest`\n"
            "3. Ask your questions here!"
        )

    return QueryResponse(response=response_text, sources=sources)

@router.get("/status")
async def get_chatbot_status():
    # 1. Check Ollama tags endpoint
    try:
        async with httpx.AsyncClient() as client:
            res = await client.get("http://localhost:11434/api/tags", timeout=1.5)
            if res.status_code == 200:
                models = res.json().get("models", [])
                if models:
                    return {
                        "status": "connected",
                        "provider": "ollama",
                        "model": models[0]["name"]
                    }
    except Exception:
        pass

    # 2. Check OpenAI
    openai_key = os.getenv("OPENAI_API_KEY")
    if openai_key:
        return {
            "status": "connected",
            "provider": "openai",
            "model": "gpt-4o-mini"
        }

    # 3. Fallback Standby
    return {
        "status": "standby",
        "provider": "local_vector_fallback",
        "model": "ONNX-MiniLM"
    }
