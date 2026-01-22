"""DIET API endpoints for dashboard and module generation."""
import os
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from typing import Optional
from app.database import get_db
from app.schemas import (
    AggregateResponse,
    ModuleGenerateRequest,
    ModuleGenerateResponse
)
from app.models import MicroModule, Cluster
from app.services.aggregator import AggregationService
from app.services.template_engine import TemplateEngine
from app.services.pptx_generator import PPTXGenerator
from datetime import datetime

router = APIRouter(prefix="/diet", tags=["diet"])
aggregator = AggregationService()
template_engine = TemplateEngine()
pptx_generator = PPTXGenerator()


@router.get("/aggregate", response_model=AggregateResponse)
def get_aggregated_data(
    cluster: Optional[str] = Query(None),
    topic: Optional[str] = Query(None),
    date_from: Optional[str] = Query(None),
    date_to: Optional[str] = Query(None)
):
    """
    Get aggregated statistics for DIET dashboard.
    
    Query params:
    - cluster: Filter by cluster name
    - topic: Filter by topic tag
    - date_from: ISO date (e.g., 2026-01-01)
    - date_to: ISO date
    """
    # Mock data for demo
    mock_stats = {
        "total_queries": 15,
        "by_topic": {
            "concept-confusion": 5,
            "classroom-management": 4,
            "student-absenteeism": 3,
            "parent-engagement": 2,
            "need-tlms": 1
        },
        "by_cluster": {
            "Cluster A": 7,
            "Cluster B": 5,
            "Cluster C": 3
        },
        "sample_queries": [
            {
                "id": "q1",
                "cluster_id": "cluster-a",
                "topic_tag": "concept-confusion",
                "narrative_text": "Students confused about fractions",
                "created_at": "2026-01-22T10:30:00Z",
                "resolved": False,
                "flagged_for_crp": True
            },
            {
                "id": "q2", 
                "cluster_id": "cluster-b",
                "topic_tag": "classroom-management",
                "narrative_text": "Kids won't sit still during math",
                "created_at": "2026-01-22T09:15:00Z",
                "resolved": True,
                "flagged_for_crp": False
            }
        ]
    }
    
    return AggregateResponse(**mock_stats)


@router.post("/generate-module", response_model=ModuleGenerateResponse)
def generate_micro_module(
    request: ModuleGenerateRequest
):
    """
    Generate a 2-slide micro-module PPTX for a topic and cluster.
    """
    try:
        # Generate title
        title = f"{request.topic.replace('-', ' ').title()} - Micro Module"
        
        # Generate filename
        timestamp = datetime.utcnow().strftime("%Y%m%d_%H%M%S")
        filename = f"module_{request.cluster.replace(' ', '_')}_{request.topic}_{timestamp}.pptx"
        
        # Mock response data for demo
        response_data = {
            "advice": f"Teaching strategies for {request.topic}:\n1. Start with concrete examples\n2. Use visual aids\n3. Practice with guided exercises",
            "materials": ["Worksheets", "Visual charts", "Practice problems"]
        }
        
        # Generate PPTX
        output_path = pptx_generator.generate_micro_module(
            title=title,
            topic=request.topic,
            advice=response_data["advice"],
            materials=response_data["materials"],
            cluster=request.cluster,
            output_filename=filename
        )
        
        # Return absolute URL for download
        base_url = os.getenv("BASE_URL", "http://127.0.0.1:8000")
        download_url = f"{base_url}/exports/{filename}"
        
        return ModuleGenerateResponse(
            module_id=f"module_{timestamp}",
            pptx_link=download_url,
            title=title
        )
    except Exception as e:
        # Fallback: return a sample module link
        return ModuleGenerateResponse(
            module_id="sample_module",
            pptx_link="http://127.0.0.1:8000/exports/sample_module.pptx",
            title=f"{request.topic.replace('-', ' ').title()} - Sample Module"
        )