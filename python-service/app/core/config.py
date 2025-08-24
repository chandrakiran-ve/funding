"""
Application configuration management using Pydantic settings.
"""
from pydantic_settings import BaseSettings
from typing import List, Optional
import os
from pathlib import Path


class Settings(BaseSettings):
    """Application settings with environment variable support."""
    
    # Application settings
    APP_NAME: str = "LangGraph AI Assistant"
    DEBUG: bool = False
    PORT: int = 8000
    
    # CORS settings
    ALLOWED_ORIGINS: List[str] = ["http://localhost:3000", "http://127.0.0.1:3000"]
    
    # Google Services
    GOOGLE_SHEETS_CREDENTIALS_PATH: Optional[str] = None
    GOOGLE_SHEETS_CREDENTIALS_JSON: Optional[str] = None
    GOOGLE_SHEETS_CREDENTIALS: Optional[str] = None  # For backward compatibility
    GOOGLE_SHEETS_SPREADSHEET_ID: Optional[str] = None
    
    # AI Services
    GEMINI_API_KEY: Optional[str] = None
    
    # Database/Cache
    REDIS_URL: Optional[str] = "redis://localhost:6379"
    
    # Security
    SECRET_KEY: Optional[str] = None  # Must be set in environment variables
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 30
    
    # Logging
    LOG_LEVEL: str = "INFO"
    
    class Config:
        env_file = ".env"
        case_sensitive = True


# Create global settings instance
settings = Settings()


def get_settings() -> Settings:
    """Get application settings."""
    return settings