"""SQLAlchemy ORM models."""
import uuid
from datetime import datetime
from sqlalchemy import Column, String, Boolean, DateTime, Text, ForeignKey, Integer
from sqlalchemy.dialects.postgresql import UUID as PGUUID
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.orm import relationship
from .database import Base


def generate_uuid():
    return str(uuid.uuid4())


class Cluster(Base):
    """Geographic/administrative cluster."""
    __tablename__ = "clusters"
    
    id = Column(String, primary_key=True, default=generate_uuid)
    name = Column(String(100), unique=True, nullable=False, index=True)
    region = Column(String(100))
    created_at = Column(DateTime, default=datetime.utcnow)
    
    # Relationships
    queries = relationship("TeacherQuery", back_populates="cluster")


class DIETUser(Base):
    """DIET officer/administrator."""
    __tablename__ = "diet_users"
    
    id = Column(String, primary_key=True, default=generate_uuid)
    name = Column(String(200), nullable=False)
    email = Column(String(200), unique=True, nullable=False)
    role = Column(String(50), default="officer")
    created_at = Column(DateTime, default=datetime.utcnow)
    
    # Relationships
    modules = relationship("MicroModule", back_populates="generated_by_user")


class TeacherQuery(Base):
    """Teacher query/problem submission."""
    __tablename__ = "teacher_queries"
    
    id = Column(String, primary_key=True, default=generate_uuid)
    phone_hash = Column(String(64), nullable=True, index=True)  # SHA-256 hash
    cluster_id = Column(String, ForeignKey("clusters.id"), nullable=False, index=True)
    topic_tag = Column(String(100), nullable=False, index=True)
    narrative_text = Column(Text, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow, index=True)
    resolved = Column(Boolean, default=False)
    flagged_for_crp = Column(Boolean, default=False)
    consent_given = Column(Boolean, default=False)
    
    # Relationships
    cluster = relationship("Cluster", back_populates="queries")


class MicroModule(Base):
    """Generated training micro-module."""
    __tablename__ = "micro_modules"
    
    id = Column(String, primary_key=True, default=generate_uuid)
    title = Column(String(200), nullable=False)
    cluster_id = Column(String, ForeignKey("clusters.id"), nullable=False)
    topic_tag = Column(String(100), nullable=False)
    content_text = Column(Text)
    slides_pptx_path = Column(String(500))
    created_at = Column(DateTime, default=datetime.utcnow)
    generated_by = Column(String, ForeignKey("diet_users.id"), nullable=True)
    
    # Relationships
    generated_by_user = relationship("DIETUser", back_populates="modules")


class LFADesign(Base):
    """Logical Framework Analysis design."""
    __tablename__ = "lfa_designs"
    
    id = Column(String, primary_key=True, default=generate_uuid)
    title = Column(String(200), nullable=False)
    problem_statement = Column(Text, nullable=False)
    student_change = Column(Text, nullable=False)
    stakeholders_json = Column(Text)  # JSON array as text for SQLite compat
    practice_changes_json = Column(Text)  # JSON array
    indicators_json = Column(Text)  # JSON array
    exported_path = Column(String(500))
    created_at = Column(DateTime, default=datetime.utcnow)
    created_by = Column(String, ForeignKey("diet_users.id"), nullable=True)