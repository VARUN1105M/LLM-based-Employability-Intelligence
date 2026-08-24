from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from typing import Optional, List
from pydantic import BaseModel
from uuid import UUID
from datetime import datetime

from app.database import get_db
from app.models import User, StudentProfile, Project, Job, ExtractedSkill, JobBookmark, ProjectBookmark
from app.dependencies import get_current_user

router = APIRouter(
    prefix="/api",
    tags=["jobs_and_projects"]
)

class JobCreateSchema(BaseModel):
    company: str
    title: str
    location: Optional[str] = "Remote"
    salary: Optional[str] = "$80,000 - $110,000"
    employment_type: Optional[str] = "Full-time"
    description: Optional[str] = None
    skills: Optional[str] = None
    apply_url: Optional[str] = "https://linkedin.com"
    source: Optional[str] = "Internal Platform"

def seed_default_jobs_if_empty(db: Session):
    count = db.query(Job).count()
    if count > 0:
        return

    sample_jobs = [
        Job(
            company="TechNova Solutions",
            title="Junior Full Stack Developer",
            location="Remote / San Francisco",
            salary="$85,000 - $105,000",
            employment_type="Full-time",
            description="We are looking for a passionate Junior Full Stack Developer to build reactive web apps using React, Python FastAPI, and PostgreSQL. You will collaborate with senior engineers and deploy scalable microservices.",
            skills="React, Python, FastAPI, JavaScript, PostgreSQL, Git",
            apply_url="https://github.com/careers",
            source="Featured"
        ),
        Job(
            company="Apex AI Research",
            title="AI / ML Associate Engineer",
            location="New York, NY (Hybrid)",
            salary="$110,000 - $135,000",
            employment_type="Full-time",
            description="Join our AI research team to build cutting-edge LLM pipelines, fine-tune models, and deploy RAG systems. Strong foundation in PyTorch, Python, Transformers, and Vector Databases required.",
            skills="Python, PyTorch, Machine Learning, Deep Learning, NLP, Docker, TensorFlow",
            apply_url="https://openai.com/careers",
            source="Featured"
        ),
        Job(
            company="CloudScale Systems",
            title="DevOps & Cloud Engineer Intern",
            location="Austin, TX / Remote",
            salary="$40 - $55 / hr",
            employment_type="Internship",
            description="Assist in building CI/CD pipelines, managing Kubernetes clusters, and configuring terraform scripts across AWS and Azure cloud infrastructure.",
            skills="Docker, Kubernetes, AWS, Linux, Git, Python, Bash",
            apply_url="https://aws.amazon.com/careers",
            source="JSearch"
        ),
        Job(
            company="CyberShield Security",
            title="Junior Cybersecurity Specialist",
            location="Washington, D.C.",
            salary="$90,000 - $115,000",
            employment_type="Full-time",
            description="Perform network security audits, vulnerability assessments, and automated threat monitoring. Knowledge of Python scripts, Wireshark, and Linux is highly valued.",
            skills="Linux, Cybersecurity, Python, Networking, SQL",
            apply_url="https://cybersecurity.com/jobs",
            source="LinkedIn"
        ),
        Job(
            company="NextGen Mobility",
            title="Frontend React Engineer",
            location="Remote",
            salary="$95,000 - $120,000",
            employment_type="Full-time",
            description="Craft beautiful modern UI components with React, Tailwind CSS, and TypeScript. Optimize web performance and component architecture.",
            skills="React, TypeScript, JavaScript, CSS, HTML, Tailwind",
            apply_url="https://frontendjobs.com",
            source="Featured"
        ),
        Job(
            company="DataMind Analytics",
            title="Data Analyst / Engineer",
            location="Chicago, IL (Hybrid)",
            salary="$80,000 - $100,000",
            employment_type="Full-time",
            description="Analyze complex datasets, generate predictive dashboards, and manage data pipelines using SQL, Python, Pandas, and PowerBI.",
            skills="Python, SQL, Pandas, Data Science, Machine Learning, PowerBI",
            apply_url="https://datamind.io/careers",
            source="JSearch"
        )
    ]
    for j in sample_jobs:
        db.add(j)
    db.commit()

def seed_default_projects_if_empty(db: Session, current_user_id: UUID):
    count = db.query(Project).count()
    if count > 0:
        return

    sample_projects = [
        Project(
            student_id=current_user_id,
            title="AI Career Intelligence & Employability Analytics Platform",
            description="Full-stack AI portal analyzing student resumes, scoring employability with ML models, and generating tailored learning roadmaps.",
            github_url="https://github.com/example/career-intelligence-ai",
            technologies="Python, FastAPI, React, PyTorch, SQLite, Tailwind"
        ),
        Project(
            student_id=current_user_id,
            title="Real-time RAG Knowledge Chatbot",
            description="Retrieval-Augmented Generation chatbot built with LangChain, FAISS vector store, and OpenAI API for querying technical documentation.",
            github_url="https://github.com/example/rag-knowledge-bot",
            technologies="Python, LangChain, OpenAI, Vector DB, Streamlit"
        ),
        Project(
            student_id=current_user_id,
            title="Distributed Microservices Task Manager",
            description="High-throughput asynchronous task queue system using Docker, Redis, Celery, and Node.js microservices.",
            github_url="https://github.com/example/microservices-task-queue",
            technologies="Node.js, Docker, Redis, Express, MongoDB"
        ),
        Project(
            student_id=current_user_id,
            title="E-Commerce Recommendation Engine",
            description="Collaborative filtering recommendation system trained on user interaction graphs to recommend personalized products in real time.",
            github_url="https://github.com/example/ecommerce-recommender",
            technologies="Python, Scikit-Learn, Pandas, Flask, PostgreSQL"
        )
    ]
    for p in sample_projects:
        db.add(p)
    db.commit()

@router.get("/jobs")
def search_jobs(
    q: Optional[str] = Query(None, description="Search term for job title, company, or description"),
    location: Optional[str] = Query(None, description="Location filter"),
    employment_type: Optional[str] = Query(None, description="Employment type filter"),
    skill: Optional[str] = Query(None, description="Skill filter"),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    seed_default_jobs_if_empty(db)
    
    query = db.query(Job)
    
    if q:
        search_pattern = f"%{q.strip()}%"
        query = query.filter(
            (Job.title.ilike(search_pattern)) |
            (Job.company.ilike(search_pattern)) |
            (Job.description.ilike(search_pattern)) |
            (Job.skills.ilike(search_pattern))
        )
        
    if location:
        query = query.filter(Job.location.ilike(f"%{location.strip()}%"))
        
    if employment_type and employment_type != "All":
        query = query.filter(Job.employment_type.ilike(f"%{employment_type.strip()}%"))
        
    if skill:
        query = query.filter(Job.skills.ilike(f"%{skill.strip()}%"))
        
    jobs = query.order_by(Job.fetched_at.desc()).all()
    
    # Calculate student skill match percentage for each job
    user_skills = set()
    if current_user.role == "student":
        skills_db = db.query(ExtractedSkill).filter(ExtractedSkill.student_id == current_user.id).all()
        user_skills = {s.skill_name.lower().strip() for s in skills_db}
        
    job_results = []
    for job in jobs:
        required = [s.strip() for s in (job.skills or "").split(",") if s.strip()]
        matched_skills = []
        if required and user_skills:
            for req in required:
                if req.lower() in user_skills or any(us in req.lower() for us in user_skills):
                    matched_skills.append(req)
                    
        match_score = round((len(matched_skills) / max(len(required), 1)) * 100) if required else 75
        if not user_skills:
            match_score = 70 # Default match score fallback
            
        job_results.append({
            "job_id": job.job_id,
            "company": job.company,
            "title": job.title,
            "location": job.location,
            "salary": job.salary,
            "employment_type": job.employment_type,
            "description": job.description,
            "skills": required,
            "apply_url": job.apply_url,
            "source": job.source,
            "match_score": min(match_score, 100),
            "matched_skills": matched_skills
        })
        
    return {
        "total_jobs": len(job_results),
        "jobs": job_results
    }

@router.post("/jobs", status_code=status.HTTP_201_CREATED)
def create_job(job_data: JobCreateSchema, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    if current_user.role not in ["recruiter", "admin", "mentor"]:
        raise HTTPException(status_code=403, detail="Only recruiters, admins, or mentors can post job listings")
        
    new_job = Job(
        company=job_data.company,
        title=job_data.title,
        location=job_data.location,
        salary=job_data.salary,
        employment_type=job_data.employment_type,
        description=job_data.description,
        skills=job_data.skills,
        apply_url=job_data.apply_url,
        source=job_data.source
    )
    db.add(new_job)
    db.commit()
    db.refresh(new_job)
    return {"message": "Job posted successfully", "job_id": new_job.job_id}

@router.get("/projects/search")
def search_projects(
    q: Optional[str] = Query(None, description="Search keyword for project title or description"),
    tech: Optional[str] = Query(None, description="Filter by tech stack"),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    seed_default_projects_if_empty(db, current_user.id)
    
    query = db.query(Project)
    
    if q:
        pattern = f"%{q.strip()}%"
        query = query.filter(
            (Project.title.ilike(pattern)) |
            (Project.description.ilike(pattern)) |
            (Project.technologies.ilike(pattern))
        )
        
    if tech:
        query = query.filter(Project.technologies.ilike(f"%{tech.strip()}%"))
        
    projects = query.all()
    
    project_list = []
    for p in projects:
        # Fetch student author name
        student_profile = db.query(StudentProfile).filter(StudentProfile.student_id == p.student_id).first()
        author_name = "Student Developer"
        if student_profile and student_profile.user:
            author_name = student_profile.user.full_name
            
        tech_tags = [t.strip() for t in (p.technologies or "").split(",") if t.strip()]
        
        project_list.append({
            "project_id": p.project_id,
            "title": p.title,
            "description": p.description,
            "github_url": p.github_url,
            "technologies": tech_tags,
            "author_name": author_name,
            "student_id": p.student_id
        })
        
    return {
        "total_projects": len(project_list),
        "projects": project_list
    }

@router.post("/jobs/{job_id}/bookmark")
def toggle_job_bookmark(job_id: UUID, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    existing = db.query(JobBookmark).filter(
        JobBookmark.student_id == current_user.id,
        JobBookmark.job_id == job_id
    ).first()
    
    if existing:
        db.delete(existing)
        db.commit()
        return {"message": "Job removed from saved bookmarks", "bookmarked": False}
    else:
        new_bookmark = JobBookmark(student_id=current_user.id, job_id=job_id, status="Saved")
        db.add(new_bookmark)
        db.commit()
        return {"message": "Job saved to bookmarks", "bookmarked": True}

@router.get("/jobs/bookmarks/me")
def get_my_bookmarked_jobs(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    bookmarks = db.query(JobBookmark).filter(JobBookmark.student_id == current_user.id).all()
    job_ids = [b.job_id for b in bookmarks]
    jobs = db.query(Job).filter(Job.job_id.in_(job_ids)).all() if job_ids else []
    
    return {
        "bookmarked_jobs": [
            {
                "job_id": j.job_id,
                "company": j.company,
                "title": j.title,
                "location": j.location,
                "salary": j.salary,
                "employment_type": j.employment_type,
                "apply_url": j.apply_url
            } for j in jobs
        ]
    }

@router.post("/projects/{project_id}/bookmark")
def toggle_project_bookmark(project_id: UUID, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    existing = db.query(ProjectBookmark).filter(
        ProjectBookmark.student_id == current_user.id,
        ProjectBookmark.project_id == project_id
    ).first()
    
    if existing:
        db.delete(existing)
        db.commit()
        return {"message": "Project removed from bookmarks", "bookmarked": False}
    else:
        new_bookmark = ProjectBookmark(student_id=current_user.id, project_id=project_id)
        db.add(new_bookmark)
        db.commit()
        return {"message": "Project bookmarked", "bookmarked": True}

@router.get("/projects/bookmarks/me")
def get_my_bookmarked_projects(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    bookmarks = db.query(ProjectBookmark).filter(ProjectBookmark.student_id == current_user.id).all()
    project_ids = [b.project_id for b in bookmarks]
    projects = db.query(Project).filter(Project.project_id.in_(project_ids)).all() if project_ids else []
    
    return {
        "bookmarked_projects": [
            {
                "project_id": p.project_id,
                "title": p.title,
                "description": p.description,
                "github_url": p.github_url,
                "technologies": (p.technologies or "").split(",")
            } for p in projects
        ]
    }

@router.get("/dashboard/recommendations")
def get_dashboard_recommendations(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    seed_default_jobs_if_empty(db)
    seed_default_projects_if_empty(db, current_user.id)
    
    # User skills
    user_skills = set()
    if current_user.role == "student":
        skills_db = db.query(ExtractedSkill).filter(ExtractedSkill.student_id == current_user.id).all()
        user_skills = {s.skill_name.lower().strip() for s in skills_db}
        
    jobs = db.query(Job).limit(6).all()
    top_jobs = []
    for job in jobs:
        required = [s.strip() for s in (job.skills or "").split(",") if s.strip()]
        matched = [r for r in required if r.lower() in user_skills or any(us in r.lower() for us in user_skills)]
        match_score = round((len(matched) / max(len(required), 1)) * 100) if required else 75
        if not user_skills:
            match_score = 70
        top_jobs.append({
            "job_id": job.job_id,
            "title": job.title,
            "company": job.company,
            "location": job.location,
            "salary": job.salary,
            "employment_type": job.employment_type,
            "apply_url": job.apply_url,
            "match_score": min(match_score, 100)
        })
        
    top_jobs.sort(key=lambda x: x["match_score"], reverse=True)
    
    projects = db.query(Project).limit(4).all()
    top_projects = [
        {
            "project_id": p.project_id,
            "title": p.title,
            "description": p.description,
            "technologies": [t.strip() for t in (p.technologies or "").split(",") if t.strip()],
            "github_url": p.github_url
        } for p in projects
    ]
    
    return {
        "top_job_recommendations": top_jobs[:3],
        "featured_projects": top_projects
    }

