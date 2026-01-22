"""LFA (Logical Framework Analysis) API endpoints."""
import os
import json
from datetime import datetime
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.database import get_db
from app.schemas import LFAExportRequest, LFAExportResponse
from app.models import LFADesign
from app.services.pptx_generator import PPTXGenerator

router = APIRouter(prefix="/lfa", tags=["lfa"])
pptx_generator = PPTXGenerator()


@router.post("/export", response_model=LFAExportResponse)
def export_lfa(
    request: LFAExportRequest,
    db: Session = Depends(get_db)
):
    """
    Export LFA design as a 1-2 slide PPTX document.
    """
    # Generate filename
    timestamp = datetime.utcnow().strftime("%Y%m%d_%H%M%S")
    safe_title = request.title.replace(" ", "_")[:50]
    filename = f"lfa_{safe_title}_{timestamp}.pptx"
    
    # Generate PPTX
    output_path = pptx_generator.generate_lfa_export(
        title=request.title,
        problem_statement=request.problem_statement,
        student_change=request.student_change,
        stakeholders=request.stakeholders,
        practice_changes=request.practice_changes,
        indicators=request.indicators,
        output_filename=filename
    )
    
    # Create database record
    lfa = LFADesign(
        title=request.title,
        problem_statement=request.problem_statement,
        student_change=request.student_change,
        stakeholders_json=json.dumps(request.stakeholders),
        practice_changes_json=json.dumps(request.practice_changes),
        indicators_json=json.dumps(request.indicators),
        exported_path=output_path
    )
    db.add(lfa)
    db.commit()
    db.refresh(lfa)
    
    # Return absolute URL for download
    base_url = os.getenv("BASE_URL", "http://127.0.0.1:8000")
    download_url = f"{base_url}/exports/{filename}"
    
    return LFAExportResponse(
        export_url=download_url,
        lfa_id=lfa.id
    )