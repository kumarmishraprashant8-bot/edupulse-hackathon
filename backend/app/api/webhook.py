"""WhatsApp webhook endpoint for Twilio integration."""
from fastapi import APIRouter, Depends, Form
from sqlalchemy.orm import Session
from twilio.twiml.messaging_response import MessagingResponse
from app.database import get_db
from app.schemas import TeacherQueryCreate
from app.api.teacher import create_teacher_query
from app.config import settings

router = APIRouter(prefix="/webhook", tags=["webhook"])


@router.post("/whatsapp")
async def whatsapp_webhook(
    From: str = Form(...),
    Body: str = Form(...),
    db: Session = Depends(get_db)
):
    """
    Twilio WhatsApp webhook endpoint.
    
    Receives messages from WhatsApp and returns TwiML response.
    """
    # Create messaging response
    resp = MessagingResponse()
    msg = resp.message()
    
    # Parse incoming message
    phone = From.replace("whatsapp:", "")
    message_text = Body.strip()
    
    # Check for consent response
    if message_text.upper() == "YES":
        msg.body(
            "Thank you for opting in! You can now send your classroom questions "
            "and receive immediate support. How can I help you today?"
        )
        return str(resp)
    
    # Default cluster for WhatsApp (can be enhanced with NLU)
    # For MVP, we'll ask user to include cluster in message or use a default
    cluster = "General"
    
    # Detect if message contains cluster info
    cluster_keywords = {
        "cluster a": "Cluster A",
        "cluster b": "Cluster B",
        "cluster c": "Cluster C"
    }
    
    for keyword, cluster_name in cluster_keywords.items():
        if keyword in message_text.lower():
            cluster = cluster_name
            break
    
    # Create query request
    query_request = TeacherQueryCreate(
        phone=phone,
        cluster=cluster,
        topic="general",  # Will be auto-detected
        text=message_text,
        consent_given=True  # Assume consent given for returning users
    )
    
    # Call teacher query endpoint
    try:
        response = create_teacher_query(query_request, db)
        
        if response.consent_required:
            msg.body(response.advice)
        else:
            # Format response for WhatsApp
            response_text = (
                f"🎓 {response.advice}\n\n"
                f"📹 Demo: {settings.FRONTEND_URL}{response.module_sample_link}\n\n"
                f"💬 Reply 'CRP' to flag for classroom visit\n"
                f"📚 Reply 'MODULE' to request training material"
            )
            msg.body(response_text)
    
    except Exception as e:
        msg.body(
            "Sorry, I encountered an error. Please try again or contact support."
        )
    
    return str(resp)