import uuid
from sqlalchemy import (
    Column, 
    String, 
    Integer, 
    Float, 
    Boolean, 
    DateTime, 
    ForeignKey, 
    Text, 
    ARRAY, 
    Date,
    func
)
from sqlalchemy.orm import relationship
from sqlalchemy.dialects.postgresql import UUID, ARRAY as PG_ARRAY
from app.database import Base

class User(Base):
    __tablename__ = "users"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    full_name = Column(String, nullable=False)
    email = Column(String, unique=True, index=True, nullable=False)
    password = Column(String, nullable=False)
    role = Column(String, nullable=False, default="student") # student, mentor, recruiter, admin
    phone = Column(String, nullable=True)
    profile_image = Column(Text, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    # Relationships
    student_profile = relationship("StudentProfile", back_populates="user", uselist=False)
    mentor_profile = relationship("Mentor", back_populates="user", uselist=False)

class StudentProfile(Base):
    __tablename__ = "student_profiles"

    student_id = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), primary_key=True)
    register_number = Column(String, nullable=True)
    college_name = Column(String, nullable=True)
    department = Column(String, nullable=True)
    year = Column(Integer, nullable=True)
    cgpa = Column(Float, nullable=True)
    tenth_percentage = Column(Float, nullable=True)
    twelfth_percentage = Column(Float, nullable=True)
    current_semester = Column(Integer, nullable=True)
    location = Column(String, nullable=True)
    github_username = Column(String, nullable=True)

    # Relationships
    user = relationship("User", back_populates="student_profile")
    resumes = relationship("Resume", back_populates="student")
    extracted_skills = relationship("ExtractedSkill", back_populates="student")
    assessments = relationship("Assessment", back_populates="student")
    predictions = relationship("ATIAPrediction", back_populates="student")
    recommendations = relationship("CareerRecommendation", back_populates="student")
    gaps = relationship("SkillGapAnalysis", back_populates="student")
    roadmaps = relationship("LearningRoadmap", back_populates="student")
    projects = relationship("Project", back_populates="student")
    certifications = relationship("Certification", back_populates="student")
    challenge_submissions = relationship("ChallengeSubmission", back_populates="student")
    mentor_sessions = relationship("MentorSession", back_populates="student")
    chat_history = relationship("ChatbotHistory", back_populates="student")

class Resume(Base):
    __tablename__ = "resumes"

    resume_id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    student_id = Column(UUID(as_uuid=True), ForeignKey("student_profiles.student_id", ondelete="CASCADE"), nullable=False)
    resume_url = Column(Text, nullable=False)
    parsed_text = Column(Text, nullable=True)
    uploaded_at = Column(DateTime(timezone=True), server_default=func.now())

    # Relationships
    student = relationship("StudentProfile", back_populates="resumes")

class ExtractedSkill(Base):
    __tablename__ = "extracted_skills"

    skill_id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    student_id = Column(UUID(as_uuid=True), ForeignKey("student_profiles.student_id", ondelete="CASCADE"), nullable=False)
    skill_name = Column(String, nullable=False)
    skill_category = Column(String, nullable=False) # technical, soft
    proficiency = Column(String, nullable=True) # Beginner, Intermediate, Advanced
    source = Column(String, nullable=False) # Resume, Assessment, Manual

    # Relationships
    student = relationship("StudentProfile", back_populates="extracted_skills")

class Assessment(Base):
    __tablename__ = "assessments"

    assessment_id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    student_id = Column(UUID(as_uuid=True), ForeignKey("student_profiles.student_id", ondelete="CASCADE"), nullable=False)
    aptitude_score = Column(Float, default=0.0)
    logical_score = Column(Float, default=0.0)
    technical_score = Column(Float, default=0.0)
    communication_score = Column(Float, default=0.0)
    personality_score = Column(Float, default=0.0)
    completed_at = Column(DateTime(timezone=True), server_default=func.now())

    # Relationships
    student = relationship("StudentProfile", back_populates="assessments")

class ATIAPrediction(Base):
    __tablename__ = "atia_predictions"

    prediction_id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    student_id = Column(UUID(as_uuid=True), ForeignKey("student_profiles.student_id", ondelete="CASCADE"), nullable=False)
    aptitude_level = Column(String, nullable=True)
    technical_level = Column(String, nullable=True)
    interest_domain = Column(String, nullable=True)
    ability_score = Column(Float, default=0.0)
    employability_score = Column(Float, default=0.0)
    confidence = Column(Float, default=0.0)
    predicted_role = Column(String, nullable=True)
    generated_at = Column(DateTime(timezone=True), server_default=func.now())

    # Relationships
    student = relationship("StudentProfile", back_populates="predictions")

class CareerRecommendation(Base):
    __tablename__ = "career_recommendations"

    recommendation_id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    student_id = Column(UUID(as_uuid=True), ForeignKey("student_profiles.student_id", ondelete="CASCADE"), nullable=False)
    career_title = Column(String, nullable=False)
    explanation = Column(Text, nullable=True)
    roadmap = Column(Text, nullable=True)
    priority = Column(Integer, default=1)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    # Relationships
    student = relationship("StudentProfile", back_populates="recommendations")

class SkillGapAnalysis(Base):
    __tablename__ = "skill_gap_analysis"

    gap_id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    student_id = Column(UUID(as_uuid=True), ForeignKey("student_profiles.student_id", ondelete="CASCADE"), nullable=False)
    required_skill = Column(String, nullable=False)
    current_level = Column(String, nullable=True)
    required_level = Column(String, nullable=True)
    gap_percentage = Column(Float, default=0.0)

    # Relationships
    student = relationship("StudentProfile", back_populates="gaps")

class LearningRoadmap(Base):
    __tablename__ = "learning_roadmap"

    roadmap_id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    student_id = Column(UUID(as_uuid=True), ForeignKey("student_profiles.student_id", ondelete="CASCADE"), nullable=False)
    week_number = Column(Integer, nullable=False)
    title = Column(String, nullable=False)
    description = Column(Text, nullable=True)
    resource_link = Column(Text, nullable=True)
    completed = Column(Boolean, default=False)

    # Relationships
    student = relationship("StudentProfile", back_populates="roadmaps")

class Project(Base):
    __tablename__ = "projects"

    project_id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    student_id = Column(UUID(as_uuid=True), ForeignKey("student_profiles.student_id", ondelete="CASCADE"), nullable=False)
    title = Column(String, nullable=False)
    description = Column(Text, nullable=True)
    github_url = Column(Text, nullable=True)
    # We will use simple comma-separated string for SQLite fallback or PG_ARRAY for PostgreSQL
    # Using simple String for compatibility
    technologies = Column(Text, nullable=True)

    # Relationships
    student = relationship("StudentProfile", back_populates="projects")

class Certification(Base):
    __tablename__ = "certifications"

    certificate_id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    student_id = Column(UUID(as_uuid=True), ForeignKey("student_profiles.student_id", ondelete="CASCADE"), nullable=False)
    title = Column(String, nullable=False)
    issuer = Column(String, nullable=False)
    issue_date = Column(Date, nullable=True)
    certificate_url = Column(Text, nullable=True)

    # Relationships
    student = relationship("StudentProfile", back_populates="certifications")

class IndustryChallenge(Base):
    __tablename__ = "industry_challenges"

    challenge_id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    company_name = Column(String, nullable=False)
    title = Column(String, nullable=False)
    description = Column(Text, nullable=True)
    required_skills = Column(Text, nullable=True) # Comma-separated
    deadline = Column(Date, nullable=True)
    reward = Column(String, nullable=True)

    # Relationships
    submissions = relationship("ChallengeSubmission", back_populates="challenge", cascade="all, delete-orphan")

class ChallengeSubmission(Base):
    __tablename__ = "challenge_submissions"

    submission_id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    challenge_id = Column(UUID(as_uuid=True), ForeignKey("industry_challenges.challenge_id", ondelete="CASCADE"), nullable=False)
    student_id = Column(UUID(as_uuid=True), ForeignKey("student_profiles.student_id", ondelete="CASCADE"), nullable=False)
    github_link = Column(Text, nullable=True)
    document_url = Column(Text, nullable=True)
    status = Column(String, nullable=False, default="Pending") # Pending, Reviewed, Shortlisted

    # Relationships
    challenge = relationship("IndustryChallenge", back_populates="submissions")
    student = relationship("StudentProfile", back_populates="challenge_submissions")

class Mentor(Base):
    __tablename__ = "mentors"

    mentor_id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    company = Column(String, nullable=True)
    designation = Column(String, nullable=True)
    expertise = Column(Text, nullable=True) # Comma-separated
    experience = Column(Integer, default=0)

    # Relationships
    user = relationship("User", back_populates="mentor_profile")
    sessions = relationship("MentorSession", back_populates="mentor", cascade="all, delete-orphan")

class MentorSession(Base):
    __tablename__ = "mentor_sessions"

    session_id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    mentor_id = Column(UUID(as_uuid=True), ForeignKey("mentors.mentor_id", ondelete="CASCADE"), nullable=False)
    student_id = Column(UUID(as_uuid=True), ForeignKey("student_profiles.student_id", ondelete="CASCADE"), nullable=False)
    meeting_date = Column(DateTime(timezone=True), nullable=False)
    feedback = Column(Text, nullable=True)

    # Relationships
    mentor = relationship("Mentor", back_populates="sessions")
    student = relationship("StudentProfile", back_populates="mentor_sessions")

class Job(Base):
    __tablename__ = "jobs"

    job_id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    external_job_id = Column(String, unique=True, index=True, nullable=True)
    company = Column(String, nullable=False)
    title = Column(String, nullable=False)
    location = Column(String, nullable=True)
    salary = Column(String, nullable=True)
    employment_type = Column(String, nullable=True)
    description = Column(Text, nullable=True)
    skills = Column(Text, nullable=True) # Comma-separated
    apply_url = Column(Text, nullable=True)
    source = Column(String, nullable=True) # JSearch, LinkedIn, etc.
    fetched_at = Column(DateTime(timezone=True), server_default=func.now())

class ChatbotHistory(Base):
    __tablename__ = "chatbot_history"

    chat_id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    student_id = Column(UUID(as_uuid=True), ForeignKey("student_profiles.student_id", ondelete="CASCADE"), nullable=False)
    question = Column(Text, nullable=False)
    answer = Column(Text, nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    # Relationships
    student = relationship("StudentProfile", back_populates="chat_history")

class KnowledgeBaseMetadata(Base):
    __tablename__ = "knowledge_base_metadata"

    document_id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    title = Column(String, nullable=False)
    category = Column(String, nullable=False) # Job Descriptions, Courses, Career Guides, Interview Questions, Skill Definitions, Industry Trends
    content = Column(Text, nullable=False)
    source = Column(String, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
