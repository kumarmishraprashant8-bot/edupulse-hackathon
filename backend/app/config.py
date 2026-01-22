"""Configuration management for EduPulse."""
import os
from pydantic_settings import BaseSettings
from typing import Optional


class Settings(BaseSettings):
    """Application settings."""
    
    # App
    PROJECT_NAME: str = "EduPulse"
    VERSION: str = "1.0.0"
    API_PREFIX: str = "/api"
    
    # Database
    DATABASE_URL: str = os.getenv(
        "DATABASE_URL", 
        "sqlite:///./edupulse.db"
    )
    
    # Security
    SECRET_KEY: str = os.getenv(
        "SECRET_KEY", 
        "dev-secret-key-change-in-production-12345"
    )
    SECRET_SALT: str = os.getenv(
        "SECRET_SALT",
        "edupulse-salt-change-in-prod"
    )
    
    # CORS
    FRONTEND_URL: str = os.getenv("FRONTEND_URL", "http://localhost:5173")
    BACKEND_CORS_ORIGINS: list = [
        "http://localhost:3000",
        "http://localhost:5173",
        "http://localhost:8000",
        "http://127.0.0.1:5173",
    ]
    
    # Twilio (optional)
    TWILIO_ACCOUNT_SID: Optional[str] = os.getenv("TWILIO_ACCOUNT_SID")
    TWILIO_AUTH_TOKEN: Optional[str] = os.getenv("TWILIO_AUTH_TOKEN")
    TWILIO_PHONE_NUMBER: Optional[str] = os.getenv("TWILIO_PHONE_NUMBER")
    
    # File paths
    TEMPLATES_PATH: str = "templates/response_templates.yaml"
    EXPORTS_PATH: str = "exports"
    MEDIA_PATH: str = "media"
    
    class Config:
        case_sensitive = True


settings = Settings()