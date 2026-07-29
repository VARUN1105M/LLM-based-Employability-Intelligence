from fastapi import APIRouter, UploadFile, File, HTTPException, status
import PyPDF2
import io
import re
from typing import List, Dict, Any

router = APIRouter(
    prefix="/api/resume",
    tags=["resume"]
)

# Common technical keywords to extract skills
TECH_KEYWORDS = [
    # Languages
    "Python", "Java", "JavaScript", "TypeScript", "C++", "C#", "Ruby", "Go", "Rust", "Kotlin", "Swift", "PHP", "SQL", "HTML", "CSS", "R", "Scala",
    # Frontend
    "React", "Angular", "Vue", "Next.js", "Vite", "Redux", "Tailwind", "Bootstrap", "jQuery", "Svelte",
    # Backend
    "Django", "Flask", "FastAPI", "Spring Boot", "Express", "Node.js", "Node", "Ruby on Rails", "Rails", "Laravel", "ASP.NET",
    # Databases
    "PostgreSQL", "MySQL", "SQLite", "MongoDB", "Redis", "Cassandra", "Supabase", "Firebase", "Oracle", "DynamoDB",
    # Cloud & DevOps
    "Docker", "Kubernetes", "AWS", "Amazon Web Services", "Azure", "GCP", "Google Cloud", "Heroku", "Netlify", "Vercel", "CI/CD", "Jenkins", "Git", "GitHub", "GitLab",
    # AI/ML & Data Science
    "PyTorch", "TensorFlow", "Scikit-learn", "Pandas", "NumPy", "Keras", "LangChain", "ChromaDB", "HuggingFace", "LLM", "RAG", "NLP", "Computer Vision", "Deep Learning", "Machine Learning"
]

def extract_text_from_pdf(pdf_bytes: bytes) -> str:
    text = ""
    try:
        pdf_file = io.BytesIO(pdf_bytes)
        reader = PyPDF2.PdfReader(pdf_file)
        for page in reader.pages:
            page_text = page.extract_text()
            if page_text:
                text += page_text + "\n"
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Failed to parse PDF file: {str(e)}"
        )
    return text

def parse_name(text: str) -> str:
    # Look at first few lines, ignore blank lines
    lines = [l.strip() for l in text.split("\n") if l.strip()]
    if not lines:
        return "Unknown Candidate"
    
    # Candidate name is usually the first line if it's short and contains letters
    for line in lines[:3]:
        # Filter out lines that look like links, addresses, or emails
        if "@" in line or "http" in line or "github.com" in line:
            continue
        words = line.split()
        if 1 <= len(words) <= 4 and all(w.isalpha() or "-" in w for w in words):
            return line
            
    return "Candidate Profile"

def parse_skills(text: str) -> List[str]:
    extracted_skills = []
    # Normalize text spacing to improve word boundary checks
    normalized_text = " " + re.sub(r"\s+", " ", text).lower() + " "
    
    for skill in TECH_KEYWORDS:
        # Escape special chars (like C++, C#, .js)
        escaped_skill = re.escape(skill.lower())
        
        # Word boundary pattern matching
        pattern = rf"(?:^|[^a-zA-Z0-9_#\+\-\.])({escaped_skill})(?:$|[^a-zA-Z0-9_#\+\-\.])"
        if re.search(pattern, normalized_text):
            # Normalize display name if matched
            if skill == "Node" or skill == "Node.js":
                if "Node.js" not in extracted_skills:
                    extracted_skills.append("Node.js")
            elif skill == "Amazon Web Services" or skill == "AWS":
                if "AWS" not in extracted_skills:
                    extracted_skills.append("AWS")
            elif skill == "Google Cloud" or skill == "GCP":
                if "GCP" not in extracted_skills:
                    extracted_skills.append("GCP")
            else:
                if skill not in extracted_skills:
                    extracted_skills.append(skill)
                    
    return extracted_skills

def parse_sections(text: str) -> Dict[str, List[Dict[str, str]]]:
    # Basic fallback lists
    experience = []
    education = []
    
    # Regex to find paragraphs that look like job titles or degrees
    lines = [l.strip() for l in text.split("\n") if l.strip()]
    
    experience_headers = ["experience", "work history", "professional experience", "employment"]
    education_headers = ["education", "academic profile", "qualifications", "university"]
    
    current_section = None
    for line in lines:
        lower_line = line.lower()
        
        # Section header checking
        if any(h in lower_line for h in experience_headers) and len(line) < 30:
            current_section = "experience"
            continue
        elif any(h in lower_line for h in education_headers) and len(line) < 30:
            current_section = "education"
            continue
        elif any(h in lower_line for h in ["skills", "projects", "certifications", "interests"]) and len(line) < 20:
            current_section = None
            continue
            
        # Extract lines based on current active section
        if current_section == "experience":
            # Look for lines with dates or company mentions
            if len(line) > 10 and len(experience) < 3:
                experience.append({"role": line, "company": "Details extracted from resume", "duration": "Active Period"})
        elif current_section == "education":
            if len(line) > 10 and len(education) < 2:
                education.append({"degree": line, "college": "Educational Institution", "cgpa": "N/A"})
                
    # Fallbacks if sections were not successfully parsed via headers
    if not experience:
        experience.append({"role": "Software Developer / Engineer", "company": "Project Showcase", "duration": "General Experience"})
    if not education:
        education.append({"degree": "University / College Degree", "college": "Academic Institution", "cgpa": "Graduated"})
        
    return {"experience": experience, "education": education}

@router.post("/analyze")
async def analyze_uploaded_resume(file: UploadFile = File(...)):
    if not file.filename.endswith(".pdf"):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Only PDF resume documents are supported"
        )
        
    contents = await file.read()
    text = extract_text_from_pdf(contents)
    
    # Extract details
    email_match = re.search(r"[\w\.-]+@[\w\.-]+\.\w+", text)
    phone_match = re.search(r"(?:\+?\d{1,3}[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}", text)
    
    email = email_match.group(0) if email_match else None
    phone = phone_match.group(0) if phone_match else None
    name = parse_name(text)
    skills = parse_skills(text)
    sections = parse_sections(text)
    
    # Calculate Score
    score = 45
    if email:
        score += 10
    if phone:
        score += 5
    score += min(len(skills) * 3, 30) # cap skills score at 30
    if len(sections["experience"]) > 0:
        score += 5
    if len(sections["education"]) > 0:
        score += 5
        
    # Cap score at 100
    score = min(score, 100)
    
    # Generate recommendations
    recommendations = []
    if not email:
        recommendations.append("Include a professional email address for recruiters to contact you directly.")
    if not phone:
        recommendations.append("Add a contact phone number to make interview outreach easier.")
    if len(skills) < 5:
        recommendations.append("Add more technical keywords matching your key stack (e.g. Git, SQL, Docker, Python).")
    if not re.search(r"\b(?:achieved|optimized|led|built|managed|increased)\b", text.lower()):
        recommendations.append("Use strong action verbs (e.g., 'Optimized query latency', 'Led backend deployment') under your experience description.")
    if len(text.split()) < 150:
        recommendations.append("Expand on your project contributions and practical coding challenges to improve page density.")
        
    # Default recommendations if candidate scores well
    if not recommendations:
        recommendations.append("Great job! Your resume format meets basic ATS check criteria.")
        recommendations.append("Ensure your LinkedIn profile and GitHub projects links are up-to-date in your contact card.")
        
    return {
        "score": score,
        "parsedData": {
            "name": name,
            "email": email or "Not specified",
            "phone": phone or "Not specified",
            "skills": skills,
            "experience": sections["experience"],
            "education": sections["education"]
        },
        "recommendations": recommendations
    }
