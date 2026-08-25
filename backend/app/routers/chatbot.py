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
    # 1. Check for OpenAI
    openai_key = os.getenv("OPENAI_API_KEY")
    if openai_key:
        try:
            headers = {
                "Authorization": f"Bearer {openai_key}",
                "Content-Type": "application/json"
            }
            system_msg = "You are Antigravity Career AI, an expert career counselor. Answer the student's question based on the provided context. Be encouraging and clear."
            user_content = f"Context information:\n{context}\n\n"
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
        full_prompt = f"Context information:\n{context}\n\n"
        if history_str:
            full_prompt += f"Conversation history:\n{history_str}\n\n"
        full_prompt += f"Question: {prompt}"
        
        payload = {
            "model": model_name,
            "prompt": full_prompt,
            "system": "You are Antigravity Career AI, an expert career counselor. Answer the student's question based on the provided context.",
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
    current_user: User = Depends(get_current_user)
):
    user_query = request.message.strip()
    if not user_query:
        raise HTTPException(status_code=400, detail="Query message cannot be empty")

    collection = get_chroma_collection()
    
    retrieved_docs = []
    sources = []
    context_str = ""

    if collection:
        try:
            # Query similarity search
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
                    context_str += f"\n[Source: {source}]\n{doc}\n"
        except Exception as e:
            print(f"Chroma DB query warning: {e}")

    # Deduplicate sources
    sources = list(set(sources))

    # Format chat history context string
    history_str = ""
    if request.history:
        recent_history = request.history[-6:]
        history_str = "\n".join([f"{'Student' if m.sender == 'user' else 'Counselor'}: {m.text}" for m in recent_history])

    # Try LLM response first
    if context_str:
        llm_response = await query_llm(user_query, context_str, history_str)
        if llm_response:
            return QueryResponse(response=llm_response, sources=sources)

    # Fallback response if LLM is offline or no documents exist
    if retrieved_docs:
        response_text = "Here is what I found in our indexed career manuals:\n\n"
        for idx, doc in enumerate(retrieved_docs):
            source = sources[idx] if idx < len(sources) else "Guide Doc"
            response_text += f"**From {source}:**\n{doc.strip()}\n\n"
        response_text += "\n*(To enable conversational AI counseling responses, please start your local Ollama server running llama3 or set up `OPENAI_API_KEY` inside `.env`)*"
    else:
        # Complete fallback when Chroma is empty
        response_text = (
            "Hello! I am your AI Career Counselor. It looks like our local knowledge base is empty.\n\n"
            "**To fix this and get context-rich answers:**\n"
            "1. Drop career documents (like PDF guides or syllabus files) inside the `backend/data/` folder.\n"
            "2. Run the indexing script to build your vector database:\n"
            "   `python -m app.scripts.ingest`\n"
            "3. Ask your questions here!"
        )

    return QueryResponse(response=response_text, sources=sources)
