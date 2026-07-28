import sys
import os

# Add parent directory to path so we can import app
sys.path.insert(0, os.path.abspath(os.path.dirname(__file__)))

from app.database import SessionLocal
from app.models import User, StudentProfile, Mentor
from app.security import get_password_hash

def seed():
    db = SessionLocal()
    try:
        # Check if users already exist
        existing = db.query(User).filter(User.email.in_([
            "student@example.com",
            "mentor@example.com",
            "recruiter@example.com",
            "admin@example.com"
        ])).all()
        
        if existing:
            print("Users already seeded or exist in the database.")
            return

        print("Seeding test users into the database...")
        
        # 1. Student User
        student = User(
            full_name="Alex Student",
            email="student@example.com",
            password=get_password_hash("password123"),
            role="student",
            phone="1234567890"
        )
        db.add(student)
        db.commit()
        db.refresh(student)
        
        student_profile = StudentProfile(
            student_id=student.id,
            register_number="REG12345",
            college_name="IEEE Engineering College",
            department="Computer Science & Engineering",
            year=4,
            cgpa=8.5,
            tenth_percentage=90.0,
            twelfth_percentage=88.5,
            current_semester=7,
            location="Mumbai, India"
        )
        db.add(student_profile)
        db.commit()

        # 2. Mentor User
        mentor = User(
            full_name="Sarah Mentor",
            email="mentor@example.com",
            password=get_password_hash("password123"),
            role="mentor",
            phone="9876543210"
        )
        db.add(mentor)
        db.commit()
        db.refresh(mentor)
        
        mentor_profile = Mentor(
            user_id=mentor.id,
            company="Tech Corp",
            designation="Principal Software Engineer",
            expertise="React, Node.js, Python, AWS",
            experience=10
        )
        db.add(mentor_profile)
        db.commit()

        # 3. Recruiter User
        recruiter = User(
            full_name="John Recruiter",
            email="recruiter@example.com",
            password=get_password_hash("password123"),
            role="recruiter"
        )
        db.add(recruiter)
        db.commit()

        # 4. Admin User
        admin = User(
            full_name="System Administrator",
            email="admin@example.com",
            password=get_password_hash("password123"),
            role="admin"
        )
        db.add(admin)
        db.commit()

        print("SUCCESS: Default test users seeded successfully!")
        print("\nAvailable credentials (Password: password123):")
        print("  - Student:   student@example.com")
        print("  - Mentor:    mentor@example.com")
        print("  - Recruiter: recruiter@example.com")
        print("  - Admin:     admin@example.com")

    except Exception as e:
        print(f"Error during seeding: {e}")
        db.rollback()
    finally:
        db.close()

if __name__ == "__main__":
    seed()
