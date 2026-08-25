from fastapi import FastAPI, Depends, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import OAuth2PasswordBearer
from sqlalchemy.orm import Session
from jose import jwt, JWTError
import uuid

from app.database import engine, Base, get_db
from app.models import User, StudentProfile, Mentor
from app.schemas import UserCreate, UserLogin, Token, UserResponse
from app.security import get_password_hash, verify_password, create_access_token, SECRET_KEY, ALGORITHM
from app.routers import profiles, resume, chatbot, jobs

# Initialize Database tables
Base.metadata.create_all(bind=engine)

# Ensure columns exist in Supabase and configure RLS Policies
with engine.connect() as conn:
    try:
        from sqlalchemy import text
        # Migrations
        conn.execute(text("ALTER TABLE student_profiles ADD COLUMN IF NOT EXISTS github_username VARCHAR;"))
        conn.execute(text("ALTER TABLE student_profiles ADD COLUMN IF NOT EXISTS resume_url VARCHAR;"))
        
        # Enable RLS
        conn.execute(text("ALTER TABLE users ENABLE ROW LEVEL SECURITY;"))
        conn.execute(text("ALTER TABLE student_profiles ENABLE ROW LEVEL SECURITY;"))
        conn.execute(text("ALTER TABLE mentors ENABLE ROW LEVEL SECURITY;"))
        conn.execute(text("ALTER TABLE projects ENABLE ROW LEVEL SECURITY;"))
        conn.execute(text("ALTER TABLE certifications ENABLE ROW LEVEL SECURITY;"))
        conn.execute(text("ALTER TABLE extracted_skills ENABLE ROW LEVEL SECURITY;"))
        
        # Create user policies
        conn.execute(text("""
            DROP POLICY IF EXISTS users_self_policy ON users;
            CREATE POLICY users_self_policy ON users FOR ALL USING (id = auth.uid());
        """))
        conn.execute(text("""
            DROP POLICY IF EXISTS student_profiles_self_policy ON student_profiles;
            CREATE POLICY student_profiles_self_policy ON student_profiles FOR ALL USING (student_id = auth.uid());
        """))
        conn.execute(text("""
            DROP POLICY IF EXISTS mentors_self_policy ON mentors;
            CREATE POLICY mentors_self_policy ON mentors FOR ALL USING (user_id = auth.uid());
        """))
        conn.execute(text("""
            DROP POLICY IF EXISTS projects_self_policy ON projects;
            CREATE POLICY projects_self_policy ON projects FOR ALL USING (student_id = auth.uid());
        """))
        conn.execute(text("""
            DROP POLICY IF EXISTS certifications_self_policy ON certifications;
            CREATE POLICY certifications_self_policy ON certifications FOR ALL USING (student_id = auth.uid());
        """))
        conn.execute(text("""
            DROP POLICY IF EXISTS extracted_skills_self_policy ON extracted_skills;
            CREATE POLICY extracted_skills_self_policy ON extracted_skills FOR ALL USING (student_id = auth.uid());
        """))
        
        conn.commit()
    except Exception as e:
        print(f"Non-blocking migration & RLS notice: {e}")

app = FastAPI(
    title="AI-Powered Student Employability & Career Intelligence Platform",
    description="Backend services for analyzing resumes, student profiles, and generating career recommendations using LLMs, RAG, and ML.",
    version="1.0.0"
)

app.include_router(profiles.router)
app.include_router(resume.router)
app.include_router(chatbot.router)
app.include_router(jobs.router)

# Mount static files for resumes
from fastapi.staticfiles import StaticFiles
import os
os.makedirs("uploads/resumes", exist_ok=True)
app.mount("/uploads", StaticFiles(directory="uploads"), name="uploads")

# CORS setup for frontend integration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], # In production, restrict this to the frontend URL
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

from app.dependencies import get_current_user, oauth2_scheme

@app.get("/api/health")
def health_check():
    return {
        "status": "healthy",
        "database": "connected"
    }

@app.post("/api/auth/register", response_model=UserResponse, status_code=status.HTTP_201_CREATED)
def register(user_data: UserCreate, db: Session = Depends(get_db)):
    # Check if user already exists
    existing_user = db.query(User).filter(User.email == user_data.email).first()
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email already registered"
        )
    
    # Hash the password
    hashed_password = get_password_hash(user_data.password)
    
    # Create main user
    new_user = User(
        full_name=user_data.full_name,
        email=user_data.email,
        password=hashed_password,
        role=user_data.role,
        phone=user_data.phone,
        profile_image=user_data.profile_image
    )
    
    db.add(new_user)
    db.commit()
    db.refresh(new_user)
    
    # Create subclass profile based on role
    if user_data.role == "student":
        student_profile = StudentProfile(student_id=new_user.id)
        db.add(student_profile)
        db.commit()
    elif user_data.role == "mentor":
        mentor_profile = Mentor(user_id=new_user.id)
        db.add(mentor_profile)
        db.commit()
        
    return new_user

@app.post("/api/auth/login", response_model=Token)
def login(login_data: UserLogin, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email == login_data.email).first()
    if not user or not verify_password(login_data.password, user.password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    # Create access token
    access_token = create_access_token(
        data={"email": user.email, "role": user.role, "user_id": str(user.id)}
    )
    return {"access_token": access_token, "token_type": "bearer"}

@app.get("/api/auth/me", response_model=UserResponse)
def get_me(current_user: User = Depends(get_current_user)):
    return current_user
