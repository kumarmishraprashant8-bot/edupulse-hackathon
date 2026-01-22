"""Teacher API endpoints."""
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from typing import Optional
from app.database import get_db
from app.schemas import (
    TeacherQueryCreate,
    TeacherQueryResponse,
    TeacherQueryDetail,
    FlagRequest
)
from app.models import TeacherQuery, Cluster
from app.services.template_engine import TemplateEngine
from app.utils.privacy import hash_phone_number, check_consent_required, get_consent_message

router = APIRouter(prefix="/teacher", tags=["teacher"])
template_engine = TemplateEngine()


@router.post("/query", response_model=TeacherQueryResponse)
def create_teacher_query(
    query: TeacherQueryCreate,
    db: Session = Depends(get_db)
):
    """
    Submit a new teacher query and receive immediate templated response.
    
    Request body:
    - phone: Phone number with country code (e.g., "+919876543210")
    - cluster: Cluster name (required)
    - topic: Topic tag (optional, will be auto-detected if not provided)
    - text: Problem description (required)
    - consent_given: Consent flag (default: false)
    """
    # Validate required fields with friendly messages
    if not query.cluster or not query.cluster.strip():
        raise HTTPException(status_code=422, detail="Please add your cluster name")
    if not query.text or not query.text.strip():
        raise HTTPException(status_code=422, detail="Please describe your classroom problem")
    
    # Hash phone for privacy (phone is optional - use ephemeral ID if not provided)
    if query.phone and query.phone.strip():
        phone_hash = hash_phone_number(query.phone)
    else:
        # Generate ephemeral identifier for demo/session tracking
        import hashlib
        import time
        ephemeral_id = f"demo-{int(time.time())}"
        phone_hash = hashlib.sha256(ephemeral_id.encode()).hexdigest()
    
    # Check consent
    consent_required = check_consent_required(phone_hash, db)
    
    if consent_required and not query.consent_given:
        return TeacherQueryResponse(
            id="consent-pending",
            advice=get_consent_message(),
            module_sample_link="",
            consent_required=True
        )
    
    # Get or create cluster
    cluster = db.query(Cluster).filter(Cluster.name == query.cluster).first()
    if not cluster:
        cluster = Cluster(name=query.cluster, region="Unknown")
        db.add(cluster)
        db.commit()
        db.refresh(cluster)
    
    # Detect topic from text
    detected_topic = template_engine.detect_topic(query.text, query.topic)
    
    # Generate templated response
    response_data = template_engine.generate_response(detected_topic, query.cluster)
    
    # Create query record
    new_query = TeacherQuery(
        phone_hash=phone_hash,
        cluster_id=cluster.id,
        topic_tag=detected_topic,
        narrative_text=query.text,
        consent_given=True  # Set to True if we reach here
    )
    db.add(new_query)
    db.commit()
    db.refresh(new_query)
    
    return TeacherQueryResponse(
        id=new_query.id,
        advice=response_data["advice"],
        module_sample_link=response_data["demo_link"],
        consent_required=False
    )


@router.get("/query/{query_id}", response_model=TeacherQueryDetail)
def get_teacher_query(query_id: str, db: Session = Depends(get_db)):
    """Get details of a specific teacher query."""
    query = db.query(TeacherQuery).filter(TeacherQuery.id == query_id).first()
    
    if not query:
        raise HTTPException(status_code=404, detail="Query not found")
    
    return query


@router.delete("/query/{query_id}")
def delete_teacher_query(query_id: str, db: Session = Depends(get_db)):
    """Delete a teacher query (right to deletion)."""
    query = db.query(TeacherQuery).filter(TeacherQuery.id == query_id).first()
    
    if not query:
        raise HTTPException(status_code=404, detail="Query not found")
    
    db.delete(query)
    db.commit()
    
    return {"message": "Query deleted successfully", "id": query_id}


@router.get("/sample-response")
def get_sample_response(
    topic: Optional[str] = Query(default="subtraction-borrowing", description="Topic tag")
):
    """
    Get a deterministic mock advice response for UI mock mode.
    Useful when backend is down or for frontend development.
    """
    response_data = template_engine.generate_response(topic, "Sample Cluster")
    
    return TeacherQueryResponse(
        id="sample-mock-id",
        advice=response_data["advice"],
        module_sample_link=response_data["demo_link"],
        consent_required=False
    )


@router.post("/flag")
def flag_query_to_crp(
    request: FlagRequest,
    db: Session = Depends(get_db)
):
    """
    Flag a teacher query for CRP (Cluster Resource Person) follow-up.
    """
    query = db.query(TeacherQuery).filter(TeacherQuery.id == request.query_id).first()
    
    if not query:
        raise HTTPException(status_code=404, detail="Query not found")
    
    query.flagged_for_crp = True
    db.commit()
    
    return {
        "success": True,
        "message": "Query flagged for CRP",
        "query_id": request.query_id
    }