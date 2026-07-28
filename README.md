# AI-Powered Adaptive Student Employability & Career Intelligence Platform

This repository contains the source code for the final year IEEE-level project: **AI-Powered Adaptive Student Employability and Career Intelligence Platform using Large Language Models (LLMs), Retrieval-Augmented Generation (RAG), Semantic Skill Matching, Machine Learning, and the Adaptive Talent Intelligence Algorithm (ATIA)**.

---

## Project Structure

```text
├── backend/                  # FastAPI Backend Services
│   ├── app/
│   │   ├── __init__.py
│   │   ├── database.py       # SQLAlchemy Connection Management
│   │   ├── main.py           # Application Entry Point & Authentication
│   │   ├── models.py         # SQLAlchemy Database Schema Mapping
│   │   ├── schemas.py        # Pydantic Schemas for Requests & Responses
│   │   └── security.py       # Password Hashing & JWT Authentication
│   ├── requirements.txt      # Python Dependencies list
│   └── venv/                 # Python Virtual Environment (Local)
│
├── frontend/                 # React.js Frontend Dashboard
│   ├── src/
│   │   ├── components/       # Pages (Dashboard, Resume, Assessments, Chat, etc.)
│   │   ├── context/          # Auth Context for User session
│   │   ├── App.jsx           # Routing configuration
│   │   ├── index.css         # Tailwind directives & core design
│   │   └── main.jsx          # React initialization
│   ├── tailwind.config.js    # Tailwind configuration (v3)
│   ├── postcss.config.js     # PostCSS configuration
│   └── package.json          # Node.js dependencies
```

---

## Getting Started

### 1. Backend Setup (FastAPI)

1. Navigate to the backend directory:
   ```bash
   cd backend
   ```
2. Activate the virtual environment:
   * **Windows (PowerShell):**
     ```powershell
     .\venv\Scripts\Activate.ps1
     ```
   * **Windows (CMD):**
     ```cmd
     .\venv\Scripts\activate.bat
     ```
   * **Linux/macOS:**
     ```bash
     source venv/bin/activate
     ```
3. Install the dependencies:
   ```bash
   pip install -r requirements.txt
   ```
4. Run the FastAPI development server:
   ```bash
   uvicorn app.main:app --reload
   ```
   * The API docs will be interactive at: [http://localhost:8000/docs](http://localhost:8000/docs)

### 2. Frontend Setup (React.js + Tailwind CSS)

1. Navigate to the frontend directory:
   ```bash
   cd ../frontend
   ```
2. Install the frontend dependencies:
   ```bash
   npm install
   ```
3. Run the Vite development server:
   ```bash
   npm run dev
   ```
   * The interface will be active at: [http://localhost:5173](http://localhost:5173)

---

## Main Functional Capabilities

1. **Intelligent Student Dashboard:** Tracks the overall Career Readiness Score and Employability Predictor.
2. **AI Resume Parser:** Submits resumes in PDF format to extract skills, evaluate ATS readiness, and suggest structural improvements.
3. **Skill Assessments:** Offers logical aptitude and technical quizzes that feed grades directly into the ATIA engine.
4. **Adaptive Roadmap:** Generates personalized week-by-week learning paths matching your targeted career paths.
5. **AI Counselor (RAG):** Interactive chatbot powered by Llama 3.1 & local documentation databases.



 Test Credentials (All roles use the same password)
Password (All roles): password123
Student Account: student@example.com
Mentor Account: mentor@example.com
Recruiter Account: recruiter@example.com
Admin Account: admin@example.com