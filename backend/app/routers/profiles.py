from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File
from sqlalchemy.orm import Session
from typing import Optional, List
from pydantic import BaseModel
from uuid import UUID
from datetime import date

from app.database import get_db
from app.models import User, StudentProfile, Mentor, Project, Certification, ExtractedSkill, ATIAPrediction, SkillGapAnalysis, Assessment
from app.dependencies import get_current_user
from app import schemas

router = APIRouter(
    prefix="/api/profiles",
    tags=["profiles"]
)

# Update Schemas
class UserUpdateSchema(BaseModel):
    full_name: str
    phone: Optional[str] = None
    profile_image: Optional[str] = None

class StudentProfileUpdateSchema(BaseModel):
    register_number: Optional[str] = None
    college_name: Optional[str] = None
    department: Optional[str] = None
    year: Optional[int] = None
    cgpa: Optional[float] = None
    tenth_percentage: Optional[float] = None
    twelfth_percentage: Optional[float] = None
    current_semester: Optional[int] = None
    location: Optional[str] = None

class MentorUpdateSchema(BaseModel):
    company: Optional[str] = None
    designation: Optional[str] = None
    expertise: Optional[str] = None # Comma-separated
    experience: Optional[int] = 0

class ProjectCreateSchema(BaseModel):
    title: str
    description: Optional[str] = None
    github_url: Optional[str] = None
    technologies: Optional[str] = None

class CertificationCreateSchema(BaseModel):
    title: str
    issuer: str
    issue_date: Optional[date] = None
    certificate_url: Optional[str] = None

@router.get("/me")
def get_my_profile(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    # Fetch base user details
    profile_data = {
        "id": current_user.id,
        "full_name": current_user.full_name,
        "email": current_user.email,
        "role": current_user.role,
        "phone": current_user.phone,
        "profile_image": current_user.profile_image,
        "created_at": current_user.created_at,
        "student_details": None,
        "mentor_details": None,
        "projects": [],
        "certifications": [],
        "skills": [],
        "prediction": None,
        "gaps": []
    }
    
    if current_user.role == "student":
        student = db.query(StudentProfile).filter(StudentProfile.student_id == current_user.id).first()
        if student:
            profile_data["student_details"] = {
                "register_number": student.register_number,
                "college_name": student.college_name,
                "department": student.department,
                "year": student.year,
                "cgpa": student.cgpa,
                "tenth_percentage": student.tenth_percentage,
                "twelfth_percentage": student.twelfth_percentage,
                "current_semester": student.current_semester,
                "location": student.location,
                "github_username": student.github_username,
                "resume_url": student.resume_url
            }
            # Fetch projects and certifications
            projects = db.query(Project).filter(Project.student_id == current_user.id).all()
            certifications = db.query(Certification).filter(Certification.student_id == current_user.id).all()
            
            profile_data["projects"] = [
                {
                    "project_id": p.project_id,
                    "title": p.title,
                    "description": p.description,
                    "github_url": p.github_url,
                    "technologies": p.technologies
                } for p in projects
            ]
            profile_data["certifications"] = [
                {
                    "certificate_id": c.certificate_id,
                    "title": c.title,
                    "issuer": c.issuer,
                    "issue_date": c.issue_date,
                    "certificate_url": c.certificate_url
                } for c in certifications
            ]
            
            # Fetch skills, predictions, and gaps
            skills = db.query(ExtractedSkill).filter(ExtractedSkill.student_id == current_user.id).all()
            profile_data["skills"] = [
                {
                    "skill_name": s.skill_name,
                    "skill_category": s.skill_category,
                    "proficiency": s.proficiency or "Intermediate",
                    "source": s.source
                } for s in skills
            ]
            
            prediction = db.query(ATIAPrediction).filter(ATIAPrediction.student_id == current_user.id).order_by(ATIAPrediction.generated_at.desc()).first()
            if prediction:
                profile_data["prediction"] = {
                    "employability_score": prediction.employability_score,
                    "ability_score": prediction.ability_score,
                    "predicted_role": prediction.predicted_role,
                    "confidence": prediction.confidence
                }
            else:
                profile_data["prediction"] = None
                
            gaps = db.query(SkillGapAnalysis).filter(SkillGapAnalysis.student_id == current_user.id).all()
            profile_data["gaps"] = [
                {
                    "required_skill": g.required_skill,
                    "current_level": g.current_level,
                    "required_level": g.required_level,
                    "gap_percentage": g.gap_percentage
                } for g in gaps
            ]
            
    elif current_user.role == "mentor":
        mentor = db.query(Mentor).filter(Mentor.user_id == current_user.id).first()
        if mentor:
            profile_data["mentor_details"] = {
                "mentor_id": mentor.mentor_id,
                "company": mentor.company,
                "designation": mentor.designation,
                "expertise": mentor.expertise,
                "experience": mentor.experience
            }
            
    return profile_data

@router.put("/user")
def update_user_details(update_data: UserUpdateSchema, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    user = db.query(User).filter(User.id == current_user.id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
        
    user.full_name = update_data.full_name
    user.phone = update_data.phone
    user.profile_image = update_data.profile_image
    
    db.commit()
    db.refresh(user)
    return {"message": "Base user details updated successfully", "user": user.full_name}

@router.put("/student")
def update_student_profile(update_data: StudentProfileUpdateSchema, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    if current_user.role != "student":
        raise HTTPException(status_code=403, detail="Only students can update student profiles")
        
    student = db.query(StudentProfile).filter(StudentProfile.student_id == current_user.id).first()
    if not student:
        student = StudentProfile(student_id=current_user.id)
        db.add(student)
        
    for key, value in update_data.model_dump(exclude_unset=True).items():
        setattr(student, key, value)
        
    db.commit()
    return {"message": "Student profile updated successfully"}

@router.put("/mentor")
def update_mentor_profile(update_data: MentorUpdateSchema, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    if current_user.role != "mentor":
        raise HTTPException(status_code=403, detail="Only mentors can update mentor profiles")
        
    mentor = db.query(Mentor).filter(Mentor.user_id == current_user.id).first()
    if not mentor:
        mentor = Mentor(user_id=current_user.id)
        db.add(mentor)
        
    for key, value in update_data.model_dump(exclude_unset=True).items():
        setattr(mentor, key, value)
        
    db.commit()
    return {"message": "Mentor profile updated successfully"}

@router.post("/project")
def add_project(project_data: ProjectCreateSchema, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    if current_user.role != "student":
        raise HTTPException(status_code=403, detail="Only students can add projects")
        
    new_project = Project(
        student_id=current_user.id,
        title=project_data.title,
        description=project_data.description,
        github_url=project_data.github_url,
        technologies=project_data.technologies
    )
    db.add(new_project)
    db.commit()
    return {"message": "Project added successfully", "project_id": new_project.project_id}

@router.delete("/project/{project_id}")
def delete_project(project_id: UUID, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    project = db.query(Project).filter(Project.project_id == project_id, Project.student_id == current_user.id).first()
    if not project:
        raise HTTPException(status_code=404, detail="Project not found or unauthorized")
        
    db.delete(project)
    db.commit()
    return {"message": "Project deleted successfully"}

@router.post("/certification")
def add_certification(cert_data: CertificationCreateSchema, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    if current_user.role != "student":
        raise HTTPException(status_code=403, detail="Only students can add certifications")
        
    new_cert = Certification(
        student_id=current_user.id,
        title=cert_data.title,
        issuer=cert_data.issuer,
        issue_date=cert_data.issue_date,
        certificate_url=cert_data.certificate_url
    )
    db.add(new_cert)
    db.commit()
    return {"message": "Certification added successfully", "certificate_id": new_cert.certificate_id}

@router.delete("/certification/{certificate_id}")
def delete_certification(certificate_id: UUID, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    cert = db.query(Certification).filter(Certification.certificate_id == certificate_id, Certification.student_id == current_user.id).first()
    if not cert:
        raise HTTPException(status_code=404, detail="Certification not found or unauthorized")
        
    db.delete(cert)
    db.commit()
    return {"message": "Certification deleted successfully"}

import requests

@router.post("/github/sync")
def sync_github_profile(username: str, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    if current_user.role != "student":
        raise HTTPException(status_code=403, detail="Only students can sync GitHub profiles")
        
    import os
    
    # Clean username (handles leading/trailing whitespace, @ prefix, and full profile URLs)
    username = username.strip()
    if not username:
        raise HTTPException(status_code=400, detail="GitHub username cannot be empty.")
        
    if "github.com/" in username:
        username = username.split("github.com/")[-1].strip("/")
        username = username.split("?")[0].split("/")[0].strip()
    elif username.startswith("@"):
        username = username[1:]
        
    if not username:
        raise HTTPException(status_code=400, detail="Invalid GitHub username provided.")
        
    headers = {"User-Agent": "fastapi-app"}
    github_token = settings.GITHUB_TOKEN or os.getenv("GITHUB_TOKEN")
    if github_token:
        headers["Authorization"] = f"token {github_token}"
    
    # 1. Fetch GitHub User Profile
    user_url = f"https://api.github.com/users/{username}"
    try:
        user_res = requests.get(user_url, headers=headers, timeout=5)
    except Exception as err:
        raise HTTPException(status_code=503, detail=f"GitHub API is unreachable: {err}")
        
    if user_res.status_code != 200:
        if user_res.status_code == 404:
            raise HTTPException(
                status_code=404, 
                detail=f"GitHub username '{username}' was not found. Please verify the username and try again."
            )
        elif user_res.status_code == 403:
            limit_remaining = user_res.headers.get("X-RateLimit-Remaining")
            if limit_remaining == "0":
                raise HTTPException(
                    status_code=429,
                    detail="GitHub API rate limit exceeded. Please try again later or configure a GITHUB_TOKEN."
                )
            raise HTTPException(
                status_code=403,
                detail=f"Access to GitHub profile was forbidden (403): {user_res.text}"
            )
        raise HTTPException(
            status_code=user_res.status_code, 
            detail=f"Failed to fetch GitHub profile: {user_res.text}"
        )
        
    github_data = user_res.json()
    
    # Update User base info (profile photo) if available
    user = db.query(User).filter(User.id == current_user.id).first()
    if user and github_data.get("avatar_url"):
        user.profile_image = github_data["avatar_url"]
        
    # Update Student Profile (location & username)
    student = db.query(StudentProfile).filter(StudentProfile.student_id == current_user.id).first()
    if student:
        student.github_username = username
        if github_data.get("location"):
            student.location = github_data["location"]
        
    db.commit()
        
    # 2. Fetch Repositories
    repos_url = f"https://api.github.com/users/{username}/repos?sort=pushed&per_page=5"
    try:
        repos_res = requests.get(repos_url, headers=headers, timeout=5)
    except Exception as err:
        raise HTTPException(status_code=503, detail=f"GitHub API is unreachable: {err}")
        
    if repos_res.status_code != 200:
        if repos_res.status_code == 403:
            limit_remaining = repos_res.headers.get("X-RateLimit-Remaining")
            if limit_remaining == "0":
                raise HTTPException(
                    status_code=429,
                    detail="GitHub API rate limit exceeded while fetching repositories. Please try again later."
                )
        raise HTTPException(
            status_code=repos_res.status_code, 
            detail=f"Failed to fetch GitHub repositories: {repos_res.text}"
        )
        
    repos = repos_res.json()
    extracted_languages = set()
    
    for repo in repos:
        repo_name = repo["name"]
        repo_desc = repo.get("description") or "No description provided."
        repo_url = repo["html_url"]
        
        # Fetch languages for this repository
        lang_url = f"https://api.github.com/repos/{username}/{repo_name}/languages"
        languages_str = ""
        try:
            lang_res = requests.get(lang_url, headers=headers, timeout=5)
            if lang_res.status_code == 200:
                langs = lang_res.json()
                if langs:
                    sorted_langs = sorted(langs.items(), key=lambda x: x[1], reverse=True)
                    languages_str = ", ".join([l[0] for l in sorted_langs[:3]])
                    for l in sorted_langs[:3]:
                        extracted_languages.add(l[0])
        except Exception:
            pass # fallback if language fetch fails
            
        # Check if project already exists
        existing_proj = db.query(Project).filter(
            Project.student_id == current_user.id,
            Project.github_url == repo_url
        ).first()
        
        if existing_proj:
            existing_proj.title = repo_name
            existing_proj.description = repo_desc
            existing_proj.technologies = languages_str
        else:
            new_proj = Project(
                student_id=current_user.id,
                title=repo_name,
                description=repo_desc,
                github_url=repo_url,
                technologies=languages_str
            )
            db.add(new_proj)
            
    # 3. Add extracted skills
    for lang in extracted_languages:
        existing_skill = db.query(ExtractedSkill).filter(
            ExtractedSkill.student_id == current_user.id,
            ExtractedSkill.skill_name == lang
        ).first()
        
        if not existing_skill:
            new_skill = ExtractedSkill(
                student_id=current_user.id,
                skill_name=lang,
                skill_category="technical",
                proficiency="Intermediate",
                source="GitHub"
            )
            db.add(new_skill)
            
    db.commit()
    return {
        "message": f"Successfully synchronized {len(repos)} repositories from GitHub!",
        "username": username,
        "avatar_url": github_data.get("avatar_url"),
        "location": github_data.get("location"),
        "repositories_synced": [r["name"] for r in repos],
        "extracted_skills": list(extracted_languages)
    }

@router.post("/github/unlink")
def unlink_github_profile(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    if current_user.role != "student":
        raise HTTPException(status_code=403, detail="Only students can unlink GitHub profiles")
        
    student = db.query(StudentProfile).filter(StudentProfile.student_id == current_user.id).first()
    if not student or not student.github_username:
        raise HTTPException(status_code=400, detail="No GitHub account linked")
        
    # Clear username link
    student.github_username = None
    
    # Optional: Delete synced projects & skills
    db.query(Project).filter(
        Project.student_id == current_user.id,
        Project.github_url.like("%github.com%")
    ).delete(synchronize_session=False)
    
    db.query(ExtractedSkill).filter(
        ExtractedSkill.student_id == current_user.id,
        ExtractedSkill.source == "GitHub"
    ).delete(synchronize_session=False)
    
    db.commit()
    return {"message": "GitHub account unlinked and portfolio data removed successfully"}

import re

def parse_github_url(url: str):
    if not url:
        return None, None
    match = re.search(r"github\.com/([^/]+)/([^/]+)", url)
    if match:
        owner = match.group(1)
        repo = match.group(2)
        if repo.endswith(".git"):
            repo = repo[:-4]
        repo = repo.split("?")[0].split("#")[0].strip("/")
        return owner, repo
    return None, None

@router.get("/project/{project_id}/analysis")
def get_project_github_analysis(project_id: UUID, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    if current_user.role != "student":
        raise HTTPException(status_code=403, detail="Only students can analyze project repositories")
        
    project = db.query(Project).filter(Project.project_id == project_id, Project.student_id == current_user.id).first()
    if not project:
        raise HTTPException(status_code=404, detail="Project not found or unauthorized")
        
    owner, repo = parse_github_url(project.github_url)
    if not owner or not repo:
        raise HTTPException(status_code=400, detail="Project does not have a valid GitHub repository URL")
        
    headers = {"User-Agent": "fastapi-app"}
    github_token = settings.GITHUB_TOKEN or os.getenv("GITHUB_TOKEN")
    if github_token:
        headers["Authorization"] = f"token {github_token}"
    
    # 1. Fetch Repo general statistics
    stats_url = f"https://api.github.com/repos/{owner}/{repo}"
    try:
        stats_res = requests.get(stats_url, headers=headers, timeout=5)
        if stats_res.status_code != 200:
            raise HTTPException(status_code=stats_res.status_code, detail=f"Failed to fetch stats from GitHub: {stats_res.text}")
        stats = stats_res.json()
    except Exception as err:
        raise HTTPException(status_code=503, detail=f"GitHub API is unreachable: {err}")
        
    # 2. Fetch Languages
    lang_url = f"https://api.github.com/repos/{owner}/{repo}/languages"
    languages_weight = {}
    try:
        lang_res = requests.get(lang_url, headers=headers, timeout=5)
        if lang_res.status_code == 200:
            langs = lang_res.json()
            total_bytes = sum(langs.values())
            if total_bytes > 0:
                languages_weight = {k: round((v / total_bytes) * 100, 2) for k, v in langs.items()}
    except Exception:
        pass
        
    # 3. Fetch Branches
    branches_url = f"https://api.github.com/repos/{owner}/{repo}/branches"
    branches = []
    try:
        branches_res = requests.get(branches_url, headers=headers, timeout=5)
        if branches_res.status_code == 200:
            branches_data = branches_res.json()
            branches = [b["name"] for b in branches_data]
    except Exception:
        pass
        
    # 4. Fetch Total Commits (header pagination trick)
    total_commits = 0
    commits_url = f"https://api.github.com/repos/{owner}/{repo}/commits?per_page=1"
    try:
        commits_res = requests.get(commits_url, headers=headers, timeout=5)
        if commits_res.status_code == 200:
            if "Link" in commits_res.headers:
                links = commits_res.headers["Link"]
                for link in links.split(","):
                    if 'rel="last"' in link:
                        match = re.search(r"[?&]page=(\d+)", link)
                        if match:
                            total_commits = int(match.group(1))
            if total_commits == 0:
                total_commits = len(commits_res.json())
    except Exception:
        pass
        
    # 5. Fetch Recent 5 Commits
    recent_commits = []
    recent_commits_url = f"https://api.github.com/repos/{owner}/{repo}/commits?per_page=5"
    try:
        recent_res = requests.get(recent_commits_url, headers=headers, timeout=5)
        if recent_res.status_code == 200:
            recent_data = recent_res.json()
            for c in recent_data:
                recent_commits.append({
                    "sha": c["sha"][:7],
                    "message": c["commit"]["message"],
                    "author": c["commit"]["author"]["name"],
                    "date": c["commit"]["author"]["date"]
                })
    except Exception:
        pass
        
    return {
        "project_title": project.title,
        "github_url": project.github_url,
        "owner": owner,
        "repo": repo,
        "description": stats.get("description") or project.description,
        "stars": stats.get("stargazers_count", 0),
        "forks": stats.get("forks_count", 0),
        "open_issues": stats.get("open_issues_count", 0),
        "size_kb": stats.get("size", 0),
        "default_branch": stats.get("default_branch", "main"),
        "languages": languages_weight,
        "total_branches": len(branches),
        "branch_names": branches,
        "total_commits": total_commits,
        "recent_commits": recent_commits
    }

import os
from app.routers.resume import extract_text_from_pdf, parse_skills, parse_name, parse_sections
from app.config import settings

def upload_file_to_supabase_storage(supabase_url: str, supabase_key: str, bucket_name: str, file_path: str, file_bytes: bytes) -> str:
    import requests
    url_base = supabase_url.rstrip("/")
    bucket_url = f"{url_base}/storage/v1/bucket"
    headers = {
        "Authorization": f"Bearer {supabase_key}",
        "apikey": supabase_key,
        "Content-Type": "application/json"
    }
    
    # Ensure bucket exists
    try:
        check = requests.get(f"{bucket_url}/{bucket_name}", headers=headers, timeout=5)
        if check.status_code != 200:
            payload = {"id": bucket_name, "name": bucket_name, "public": True}
            requests.post(bucket_url, headers=headers, json=payload, timeout=5)
    except Exception:
        pass
        
    # Upload object
    upload_url = f"{url_base}/storage/v1/object/{bucket_name}/{file_path}"
    upload_headers = {
        "Authorization": f"Bearer {supabase_key}",
        "apikey": supabase_key,
        "Content-Type": "application/pdf",
        "x-upsert": "true"
    }
    
    try:
        res = requests.post(upload_url, headers=upload_headers, data=file_bytes, timeout=10)
        if res.status_code in [200, 201]:
            return f"{url_base}/storage/v1/object/public/{bucket_name}/{file_path}"
    except Exception as e:
        print(f"Failed to upload to Supabase: {e}")
        
    return ""

def delete_file_from_supabase_storage(supabase_url: str, supabase_key: str, bucket_name: str, file_path: str) -> bool:
    import requests
    url_base = supabase_url.rstrip("/")
    delete_url = f"{url_base}/storage/v1/object/{bucket_name}/{file_path}"
    headers = {
        "Authorization": f"Bearer {supabase_key}",
        "apikey": supabase_key
    }
    try:
        res = requests.delete(delete_url, headers=headers, timeout=5)
        if res.status_code == 200:
            return True
    except Exception as e:
        print(f"Failed to delete from Supabase storage: {e}")
    return False

@router.post("/resume/upload")
async def upload_student_resume(
    file: UploadFile = File(...), 
    current_user: User = Depends(get_current_user), 
    db: Session = Depends(get_db)
):
    if current_user.role != "student":
        raise HTTPException(status_code=403, detail="Only students can upload resumes to their profile")
        
    if not file.filename.endswith(".pdf"):
        raise HTTPException(status_code=400, detail="Only PDF format is supported")
        
    student = db.query(StudentProfile).filter(StudentProfile.student_id == current_user.id).first()
    if not student:
        raise HTTPException(status_code=404, detail="Student profile not found")
        
    filename = f"{current_user.id}.pdf"
    contents = await file.read()
    
    supabase_url = ""
    # Try uploading to Supabase Storage Bucket
    if settings.SUPABASE_URL and settings.SUPABASE_KEY:
        supabase_url = upload_file_to_supabase_storage(
            settings.SUPABASE_URL,
            settings.SUPABASE_KEY,
            "resumes",
            filename,
            contents
        )
        
    if supabase_url:
        student.resume_url = supabase_url
    else:
        # Fallback to local server storage
        os.makedirs("uploads/resumes", exist_ok=True)
        file_path = os.path.join("uploads/resumes", filename)
        try:
            with open(file_path, "wb") as f:
                f.write(contents)
            student.resume_url = f"/uploads/resumes/{filename}"
        except Exception as e:
            raise HTTPException(status_code=500, detail=f"Failed to save resume file locally: {e}")
            
    # Extract text & skills
    extracted_text = extract_text_from_pdf(contents)
    skills = parse_skills(extracted_text)
    
    # Extract name, email, phone, education, projects/experience
    email_match = re.search(r"[\w\.-]+@[\w\.-]+\.\w+", extracted_text)
    phone_match = re.search(r"(?:\+?\d{1,3}[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}", extracted_text)
    
    email = email_match.group(0) if email_match else None
    phone = phone_match.group(0) if phone_match else None
    name = parse_name(extracted_text)
    sections = parse_sections(extracted_text)
    
    # 1. Fit to required fields in User table
    user = db.query(User).filter(User.id == current_user.id).first()
    if user:
        if name and name not in ["Unknown Candidate", "Candidate Profile"]:
            user.full_name = name
        if phone:
            user.phone = phone
            
    # 2. Fit to required fields in StudentProfile table
    # Parse CGPA
    cgpa_match = re.search(r"\b(?:cgpa|gpa)\b\s*[:=-]?\s*([0-9]\.\d{1,2}|10)\b", extracted_text.lower())
    if cgpa_match:
        try:
            student.cgpa = float(cgpa_match.group(1))
        except ValueError:
            pass
    elif not student.cgpa:
        student.cgpa = 8.5  # default if not set
        
    # Parse College
    college_name = None
    for line in extracted_text.split("\n"):
        line_lower = line.lower()
        if "university" in line_lower or "college" in line_lower or "institute" in line_lower or "school of" in line_lower:
            if "@" not in line and "http" not in line and len(line.strip()) < 100:
                college_name = line.strip()
                break
    if college_name:
        student.college_name = college_name
    elif not student.college_name:
        student.college_name = "IEEE Engineering College"
        
    # Parse Department
    department = None
    for line in extracted_text.split("\n"):
        line_lower = line.lower()
        if "computer science" in line_lower or "information technology" in line_lower or "software engineering" in line_lower or "data science" in line_lower or "electronics" in line_lower or "mechanical" in line_lower or "electrical" in line_lower:
            if len(line.strip()) < 100:
                department = line.strip()
                break
    if department:
        student.department = department
    elif not student.department:
        student.department = "Computer Science & Engineering"
        
    if not student.year:
        student.year = 4
    if not student.current_semester:
        student.current_semester = 7
        
    # Parse Location
    location_match = re.search(r"\b(?:mumbai|delhi|bangalore|pune|hyderabad|chennai|kolkata|san francisco|new york|london|india|usa|uk)\b", extracted_text.lower())
    if location_match:
        student.location = location_match.group(0).capitalize()
    elif not student.location:
        student.location = "Mumbai, India"

    # 3. Save extracted skills
    db.query(ExtractedSkill).filter(
        ExtractedSkill.student_id == current_user.id,
        ExtractedSkill.source == "Resume"
    ).delete(synchronize_session=False)
    
    for skill_name in skills:
        existing = db.query(ExtractedSkill).filter(
            ExtractedSkill.student_id == current_user.id,
            ExtractedSkill.skill_name == skill_name
        ).first()
        
        if not existing:
            new_skill = ExtractedSkill(
                student_id=current_user.id,
                skill_name=skill_name,
                skill_category="technical",
                proficiency="Intermediate",
                source="Resume"
            )
            db.add(new_skill)
            
    # 4. Save projects from experience
    db.query(Project).filter(Project.student_id == current_user.id).delete(synchronize_session=False)
    for exp in sections.get("experience", []):
        role_title = exp.get("role", "").strip()
        if role_title and role_title not in ["Software Developer / Engineer", "University / College Degree"]:
            new_proj = Project(
                student_id=current_user.id,
                title=role_title[:100],
                description=f"Experience/work details at {exp.get('company', 'Company')}. Duration: {exp.get('duration', 'Active Period')}.",
                technologies=", ".join(skills[:3]) if skills else "General"
            )
            db.add(new_proj)
            
    # 5. ATIA Prediction logic based on skills
    skills_lower = [s.lower() for s in skills]
    if any(s in skills_lower for s in ["machine learning", "tensorflow", "pytorch", "deep learning", "nlp", "ai", "llm", "rag", "scikit-learn"]):
        predicted_role = "AI / ML Engineer"
        interest_domain = "Artificial Intelligence"
        required_skills_for_role = ["Python", "PyTorch", "Docker", "Machine Learning", "SQL"]
    elif any(s in skills_lower for s in ["react", "next.js", "vue", "angular", "html", "css", "typescript", "javascript"]):
        if any(s in skills_lower for s in ["node.js", "django", "flask", "fastapi", "postgresql", "mongodb", "mysql", "express"]):
            predicted_role = "Full Stack Engineer"
            interest_domain = "Web Development"
            required_skills_for_role = ["React", "Node.js", "FastAPI", "Docker", "PostgreSQL"]
        else:
            predicted_role = "Frontend Engineer"
            interest_domain = "UI/UX & Frontend"
            required_skills_for_role = ["React", "TypeScript", "Tailwind", "CSS", "Vite"]
    else:
        predicted_role = "Software Developer"
        interest_domain = "Software Development"
        required_skills_for_role = ["Python", "Java", "Git", "SQL", "Docker"]

    # Calculate Employability & Ability Scores
    ability_score = 60.0 + min(len(skills) * 3.5, 30.0)
    if student.cgpa:
        ability_score += min((student.cgpa - 5.0) * 8.0, 10.0)
    
    employability_score = min(ability_score + 5.0, 100.0)
    confidence = 0.82 + min(len(skills) * 0.01, 0.13)

    db.query(ATIAPrediction).filter(ATIAPrediction.student_id == current_user.id).delete(synchronize_session=False)
    prediction = ATIAPrediction(
        student_id=current_user.id,
        aptitude_level="Advanced" if ability_score > 80 else "Intermediate",
        technical_level="Advanced" if len(skills) > 8 else "Intermediate",
        interest_domain=interest_domain,
        ability_score=round(ability_score, 1),
        employability_score=round(employability_score, 1),
        confidence=round(confidence, 2),
        predicted_role=predicted_role
    )
    db.add(prediction)

    # 6. Skill Gap Analysis
    db.query(SkillGapAnalysis).filter(SkillGapAnalysis.student_id == current_user.id).delete(synchronize_session=False)
    for req_skill in required_skills_for_role:
        if req_skill.lower() not in skills_lower:
            gap = SkillGapAnalysis(
                student_id=current_user.id,
                required_skill=req_skill,
                current_level="None",
                required_level="Intermediate",
                gap_percentage=60.0
            )
            db.add(gap)
        else:
            gap = SkillGapAnalysis(
                student_id=current_user.id,
                required_skill=req_skill,
                current_level="Intermediate",
                required_level="Advanced",
                gap_percentage=25.0
            )
            db.add(gap)

    db.commit()
    db.refresh(student)
    
    return {
        "message": "Resume uploaded, analyzed, and student onboarded successfully!",
        "resume_url": student.resume_url,
        "skills_extracted": skills
    }

@router.delete("/resume/delete")
async def delete_student_resume(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    if current_user.role != "student":
        raise HTTPException(status_code=403, detail="Only students can manage profile resumes")
        
    student = db.query(StudentProfile).filter(StudentProfile.student_id == current_user.id).first()
    if not student:
        raise HTTPException(status_code=404, detail="Student profile not found")
        
    if not student.resume_url:
        raise HTTPException(status_code=400, detail="No resume is currently uploaded")
        
    filename = f"{current_user.id}.pdf"
    
    # Try deleting from Supabase storage bucket
    if settings.SUPABASE_URL and settings.SUPABASE_KEY:
        delete_file_from_supabase_storage(
            settings.SUPABASE_URL,
            settings.SUPABASE_KEY,
            "resumes",
            filename
        )
        
    # Delete locally if it was fallback
    local_path = os.path.join("uploads/resumes", filename)
    if os.path.exists(local_path):
        try:
            os.remove(local_path)
        except Exception:
            pass
            
    # Reset resume URL
    student.resume_url = None
    
    # Clear extracted skills from resume
    db.query(ExtractedSkill).filter(
        ExtractedSkill.student_id == current_user.id,
        ExtractedSkill.source == "Resume"
    ).delete(synchronize_session=False)
    
    db.commit()
    db.refresh(student)
    
    return {"message": "Resume deleted successfully"}

@router.post("/assessment", response_model=schemas.AssessmentResponse)
def submit_assessment(
    assessment_in: schemas.AssessmentCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    student = db.query(StudentProfile).filter(StudentProfile.student_id == current_user.id).first()
    if not student:
        raise HTTPException(status_code=404, detail="Student profile not found")

    # Save new assessment record
    db_assessment = Assessment(
        student_id=current_user.id,
        aptitude_score=assessment_in.aptitude_score,
        logical_score=assessment_in.logical_score,
        technical_score=assessment_in.technical_score,
        communication_score=assessment_in.communication_score,
        personality_score=assessment_in.personality_score
    )
    db.add(db_assessment)
    db.commit()
    db.refresh(db_assessment)

    # 2. Recalculate ATIA Predictions
    skills = db.query(ExtractedSkill).filter(ExtractedSkill.student_id == current_user.id).all()
    skills_lower = [s.skill_name.lower() for s in skills]

    # Predict role based on matching skills
    if any(s in skills_lower for s in ["machine learning", "tensorflow", "pytorch", "deep learning", "nlp", "ai", "llm", "rag", "scikit-learn"]):
        predicted_role = "AI / ML Engineer"
        interest_domain = "Artificial Intelligence"
        required_skills_for_role = ["Python", "PyTorch", "Docker", "Machine Learning", "SQL"]
    elif any(s in skills_lower for s in ["react", "next.js", "vue", "angular", "html", "css", "typescript", "javascript"]):
        if any(s in skills_lower for s in ["node.js", "django", "flask", "fastapi", "postgresql", "mongodb", "mysql", "express"]):
            predicted_role = "Full Stack Engineer"
            interest_domain = "Web Development"
            required_skills_for_role = ["React", "Node.js", "FastAPI", "Docker", "PostgreSQL"]
        else:
            predicted_role = "Frontend Engineer"
            interest_domain = "UI/UX & Frontend"
            required_skills_for_role = ["React", "TypeScript", "Tailwind", "CSS", "Vite"]
    else:
        predicted_role = "Software Developer"
        interest_domain = "Software Development"
        required_skills_for_role = ["Python", "Java", "Git", "SQL", "Docker"]

    # Calculate scores with quiz influences
    ability_score = 60.0 + min(len(skills) * 3.5, 30.0)
    if student.cgpa:
        ability_score += min((student.cgpa - 5.0) * 8.0, 10.0)

    # Aggregate quiz outcomes (Aptitude & Technical)
    quiz_bonus = 0.0
    count_quizzes = 0
    if db_assessment.logical_score > 0:
        quiz_bonus += db_assessment.logical_score
        count_quizzes += 1
    if db_assessment.technical_score > 0:
        quiz_bonus += db_assessment.technical_score
        count_quizzes += 1
        
    if count_quizzes > 0:
        avg_quiz = quiz_bonus / count_quizzes
        ability_score += (avg_quiz - 50.0) * 0.2

    ability_score = max(50.0, min(ability_score, 100.0))
    employability_score = min(ability_score + 5.0, 100.0)
    confidence = 0.82 + min(len(skills) * 0.01, 0.13)

    # Remove older predictions and save the new ATIA prediction
    db.query(ATIAPrediction).filter(ATIAPrediction.student_id == current_user.id).delete(synchronize_session=False)
    prediction = ATIAPrediction(
        student_id=current_user.id,
        aptitude_level="Advanced" if (db_assessment.logical_score or 0) > 75 else "Intermediate",
        technical_level="Advanced" if (db_assessment.technical_score or 0) > 75 else "Intermediate",
        interest_domain=interest_domain,
        ability_score=round(ability_score, 1),
        employability_score=round(employability_score, 1),
        confidence=round(confidence, 2),
        predicted_role=predicted_role
    )
    db.add(prediction)

    # 3. Update Skill Gap Analysis
    db.query(SkillGapAnalysis).filter(SkillGapAnalysis.student_id == current_user.id).delete(synchronize_session=False)
    for req_skill in required_skills_for_role:
        if req_skill.lower() not in skills_lower:
            gap = SkillGapAnalysis(
                student_id=current_user.id,
                required_skill=req_skill,
                current_level="None",
                required_level="Intermediate",
                gap_percentage=60.0
            )
            db.add(gap)

    db.commit()
    return db_assessment
