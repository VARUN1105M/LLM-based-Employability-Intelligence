from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import Optional, List
from pydantic import BaseModel
from uuid import UUID
from datetime import date

from app.database import get_db
from app.models import User, StudentProfile, Mentor, Project, Certification, ExtractedSkill
from app.dependencies import get_current_user

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
        "certifications": []
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
                "github_username": student.github_username
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
        
    headers = {"User-Agent": "fastapi-app"}
    
    # 1. Fetch GitHub User Profile
    user_url = f"https://api.github.com/users/{username}"
    try:
        user_res = requests.get(user_url, headers=headers, timeout=5)
    except Exception as err:
        raise HTTPException(status_code=503, detail=f"GitHub API is unreachable: {err}")
        
    if user_res.status_code != 200:
        raise HTTPException(status_code=user_res.status_code, detail=f"Failed to fetch GitHub profile: {user_res.text}")
        
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
        raise HTTPException(status_code=repos_res.status_code, detail="Failed to fetch GitHub repositories")
        
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
                        match = re.search(r"page=(\d+)", link)
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
