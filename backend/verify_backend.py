import sys
import os

# Add parent directory to path so we can import app
sys.path.insert(0, os.path.abspath(os.path.dirname(__file__)))

try:
    print("Initializing test database connection and creating tables...")
    
    # We will override DATABASE_URL to use a temporary SQLite file for compilation checks
    os.environ["DATABASE_URL"] = "sqlite:///./temp_test.db"
    
    from app.database import engine, Base
    import app.models # make sure models are registered
    
    Base.metadata.create_all(bind=engine)
    print("Database tables created successfully!")
    
    # Dispose engine to close active connections
    engine.dispose()
    
    # Clean up the test database file
    if os.path.exists("./temp_test.db"):
        os.remove("./temp_test.db")
        print("Cleanup completed.")
        
    print("SUCCESS: SQLAlchemy models compiled and bound with no errors.")
    sys.exit(0)
    
except Exception as e:
    print(f"FAILED: Database verification failed with error: {e}")
    sys.exit(1)
