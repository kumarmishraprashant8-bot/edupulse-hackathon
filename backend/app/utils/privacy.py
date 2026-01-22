"""Privacy utilities for phone number hashing and consent management."""
import hashlib
import os
from sqlalchemy.orm import Session
from app.models import TeacherQuery
from app.config import settings


def hash_phone_number(phone: str) -> str:
    """
    Hash phone number using SHA-256 with SECRET_SALT.
    
    Args:
        phone: Phone number with country code (e.g., "+919876543210")
    
    Returns:
        64-character hexadecimal hash string
    """
    # Get SECRET_SALT from environment (required)
    secret_salt = os.getenv("SECRET_SALT", settings.SECRET_KEY)
    
    # Combine phone + salt and hash
    combined = phone + secret_salt
    hash_obj = hashlib.sha256(combined.encode('utf-8'))
    return hash_obj.hexdigest()


def check_consent_required(phone_hash: str, db: Session) -> bool:
    """
    Check if consent is required for a phone hash.
    
    Consent is required if this is the first query from this phone.
    
    Args:
        phone_hash: Hashed phone number
        db: Database session
    
    Returns:
        True if consent required (first time user), False otherwise
    """
    existing = db.query(TeacherQuery).filter(
        TeacherQuery.phone_hash == phone_hash
    ).first()
    
    return existing is None


def get_consent_message() -> str:
    """
    Get consent message for first-time users.
    
    Returns:
        Consent message text
    """
    return (
        "Welcome to EduPulse! 📚\n\n"
        "To provide you with personalized support, we need your consent to "
        "use your query data (anonymized) for improving our services.\n\n"
        "Reply with 'YES' or set consent_given=true to continue.\n\n"
        "Your phone number is never stored - only a secure hash is used."
    )
