from pydantic import BaseModel, EmailStr, Field
from typing import Optional, List
from datetime import datetime, date
from uuid import UUID

# Token Schemas
class Token(BaseModel):
    access_token: str
    token_type: str

class TokenData(BaseModel):
    email: Optional[str] = None
    role: Optional[str] = None
    user_id: Optional[UUID] = None

# User Schemas
class UserBase(BaseModel):
    full_name: str
    email: EmailStr
    role: str = "student" # student, mentor, recruiter, admin
    phone: Optional[str] = None
    profile_image: Optional[str] = None

class UserCreate(UserBase):
    password: str

class UserResponse(UserBase):
    id: UUID
    created_at: datetime

    class Config:
        from_attributes = True

# Login Schema
class UserLogin(BaseModel):
    email: EmailStr
    password: str

# Student Profile Schemas
class StudentProfileBase(BaseModel):
    register_number: Optional[str] = None
    college_name: Optional[str] = None
    department: Optional[str] = None
    year: Optional[int] = None
    cgpa: Optional[float] = None
    tenth_percentage: Optional[float] = None
    twelfth_percentage: Optional[float] = None
    current_semester: Optional[int] = None
    location: Optional[str] = None

class StudentProfileCreate(StudentProfileBase):
    pass

class StudentProfileResponse(StudentProfileBase):
    student_id: UUID
    user: UserResponse

    class Config:
        from_attributes = True

# Resume Schemas
class ResumeResponse(BaseModel):
    resume_id: UUID
    student_id: UUID
    resume_url: str
    uploaded_at: datetime

    class Config:
        from_attributes = True

# Skill Schemas
class SkillBase(BaseModel):
    skill_name: str
    skill_category: str
    proficiency: Optional[str] = None
    source: str

class SkillCreate(SkillBase):
    pass

class SkillResponse(SkillBase):
    skill_id: UUID
    student_id: UUID

    class Config:
        from_attributes = True

# Assessment Schemas
class AssessmentBase(BaseModel):
    aptitude_score: float = 0.0
    logical_score: float = 0.0
    technical_score: float = 0.0
    communication_score: float = 0.0
    personality_score: float = 0.0

class AssessmentCreate(AssessmentBase):
    pass

class AssessmentResponse(AssessmentBase):
    assessment_id: UUID
    student_id: UUID
    completed_at: datetime

    class Config:
        from_attributes = True

# ATIA Prediction Schemas
class ATIAPredictionResponse(BaseModel):
    prediction_id: UUID
    student_id: UUID
    aptitude_level: Optional[str] = None
    technical_level: Optional[str] = None
    interest_domain: Optional[str] = None
    ability_score: float
    employability_score: float
    confidence: float
    predicted_role: Optional[str] = None
    generated_at: datetime

    class Config:
        from_attributes = True

# Career Recommendation Schemas
class CareerRecommendationResponse(BaseModel):
    recommendation_id: UUID
    student_id: UUID
    career_title: str
    explanation: Optional[str] = None
    roadmap: Optional[str] = None
    priority: int
    created_at: datetime

    class Config:
        from_attributes = True

# Skill Gap Analysis Schemas
class SkillGapAnalysisResponse(BaseModel):
    gap_id: UUID
    student_id: UUID
    required_skill: str
    current_level: Optional[str] = None
    required_level: Optional[str] = None
    gap_percentage: float

    class Config:
        from_attributes = True

# Learning Roadmap Schemas
class LearningRoadmapResponse(BaseModel):
    roadmap_id: UUID
    student_id: UUID
    week_number: int
    title: str
    description: Optional[str] = None
    resource_link: Optional[str] = None
    completed: bool

    class Config:
        from_attributes = True

# Project Schemas
class ProjectBase(BaseModel):
    title: str
    description: Optional[str] = None
    github_url: Optional[str] = None
    technologies: Optional[str] = None # Comma separated

class ProjectCreate(ProjectBase):
    pass

class ProjectResponse(ProjectBase):
    project_id: UUID
    student_id: UUID

    class Config:
        from_attributes = True

# Certification Schemas
class CertificationBase(BaseModel):
    title: str
    issuer: str
    issue_date: Optional[date] = None
    certificate_url: Optional[str] = None

class CertificationCreate(CertificationBase):
    pass

class CertificationResponse(CertificationBase):
    certificate_id: UUID
    student_id: UUID

    class Config:
        from_attributes = True

# Industry Challenge Schemas
class IndustryChallengeBase(BaseModel):
    company_name: str
    title: str
    description: Optional[str] = None
    required_skills: Optional[str] = None
    deadline: Optional[date] = None
    reward: Optional[str] = None

class IndustryChallengeCreate(IndustryChallengeBase):
    pass

class IndustryChallengeResponse(IndustryChallengeBase):
    challenge_id: UUID

    class Config:
        from_attributes = True

# Challenge Submission Schemas
class ChallengeSubmissionCreate(BaseModel):
    github_link: Optional[str] = None
    document_url: Optional[str] = None

class ChallengeSubmissionResponse(BaseModel):
    submission_id: UUID
    challenge_id: UUID
    student_id: UUID
    github_link: Optional[str] = None
    document_url: Optional[str] = None
    status: str

    class Config:
        from_attributes = True

# Mentor Schemas
class MentorBase(BaseModel):
    company: Optional[str] = None
    designation: Optional[str] = None
    expertise: Optional[str] = None
    experience: int = 0

class MentorCreate(MentorBase):
    pass

class MentorResponse(MentorBase):
    mentor_id: UUID
    user: UserResponse

    class Config:
        from_attributes = True

# Mentor Session Schemas
class MentorSessionCreate(BaseModel):
    mentor_id: UUID
    meeting_date: datetime

class MentorSessionResponse(BaseModel):
    session_id: UUID
    mentor_id: UUID
    student_id: UUID
    meeting_date: datetime
    feedback: Optional[str] = None

    class Config:
        from_attributes = True
