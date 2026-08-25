from pydantic_settings import BaseSettings, SettingsConfigDict
from typing import Optional

class Settings(BaseSettings):
    # Supabase / PostgreSQL Database Connection URL
    # Direct Connection (Port 5432) or Connection Pooler (Port 6543)
    DATABASE_URL: str = "postgresql://postgres:postgres@localhost:5432/career_intelligence"
    
    # Optional Supabase API keys for storage or edge functions
    SUPABASE_URL: Optional[str] = None
    SUPABASE_KEY: Optional[str] = None
    GITHUB_TOKEN: Optional[str] = None
    
    # JWT security configuration
    SECRET_KEY: str = "SUPER_SECRET_KEY_FOR_FINAL_YEAR_PROJECT_DEVELOPMENT"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 1440 # 24 hours

    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8", extra="ignore")

settings = Settings()
