"""Pydantic schemas for request/response validation."""
from datetime import datetime
from typing import Optional, List
from pydantic import BaseModel, Field


# Teacher Query Schemas
class TeacherQueryCreate(BaseModel):
    """Schema for creating a teacher query."""
    phone: Optional[str] = Field(default="", description="Phone number with country code (optional)")
    cluster: str = Field(..., description="Cluster name")
    topic: str = Field(default="general", description="Topic tag/identifier")
    text: str = Field(..., description="Problem narrative")
    consent_given: bool = Field(default=True, description="Explicit consent flag")


class TeacherQueryResponse(BaseModel):
    """Schema for teacher query response."""
    id: str
    advice: str
    module_sample_link: str
    consent_required: bool = False
    
    class Config:
        from_attributes = True


class TeacherQueryDetail(BaseModel):
    """Detailed teacher query."""
    id: str
    cluster_id: str
    topic_tag: str
    narrative_text: str
    created_at: datetime
    resolved: bool
    flagged_for_crp: bool
    
    class Config:
        from_attributes = True


# Aggregation Schemas
class AggregateRequest(BaseModel):
    """Request for aggregated data."""
    cluster: Optional[str] = None
    topic: Optional[str] = None
    date_from: Optional[str] = None
    date_to: Optional[str] = None


class AggregateResponse(BaseModel):
    """Aggregated query statistics."""
    total_queries: int
    by_topic: dict
    by_cluster: dict
    sample_queries: List[TeacherQueryDetail]


# Module Generation Schemas
class ModuleGenerateRequest(BaseModel):
    """Request to generate micro-module."""
    cluster: str
    topic: str
    template: str = Field(default="default", description="Template identifier")


class ModuleGenerateResponse(BaseModel):
    """Response with generated module."""
    module_id: str
    pptx_link: str
    title: str


# LFA Schemas
class LFAExportRequest(BaseModel):
    """Request to export LFA design."""
    title: str
    problem_statement: str
    student_change: str
    stakeholders: List[str]
    practice_changes: List[str]
    indicators: List[str]


class LFAExportResponse(BaseModel):
    """Response with LFA export."""
    export_url: str
    lfa_id: str


# Flag to CRP Schema
class FlagRequest(BaseModel):
    """Request to flag a query for CRP."""
    query_id: str
    reason: str = Field(default="Teacher flagged for CRP follow-up", description="Reason for flagging")


# Webhook Schemas
class WhatsAppMessage(BaseModel):
    """WhatsApp incoming message."""
    From: str = Field(..., alias="From")
    Body: str = Field(..., alias="Body")
    
    class Config:
        populate_by_name = True