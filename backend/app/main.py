"""Main FastAPI application."""
import os
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from app.config import settings
from app.database import init_db
from app.api import teacher, diet, lfa, webhook

# Initialize database
init_db()

# Create exports directory
os.makedirs(settings.EXPORTS_PATH, exist_ok=True)
os.makedirs(settings.MEDIA_PATH, exist_ok=True)

# Create FastAPI app
app = FastAPI(
    title=settings.PROJECT_NAME,
    version=settings.VERSION,
    description="Teacher support platform for low-bandwidth environments"
)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.BACKEND_CORS_ORIGINS + ["http://localhost:5173", "http://127.0.0.1:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Add validation error handler for friendly messages
from fastapi.exceptions import RequestValidationError
from fastapi.responses import JSONResponse

@app.exception_handler(RequestValidationError)
async def validation_exception_handler(request, exc: RequestValidationError):
    """Convert FastAPI validation errors to friendly messages."""
    errors = []
    for error in exc.errors():
        field = ".".join(str(loc) for loc in error["loc"] if loc != "body")
        msg = error["msg"]
        # Friendly field names
        field_map = {
            "cluster": "Cluster name",
            "text": "Problem description",
            "phone": "Phone number",
            "topic": "Topic",
        }
        friendly_field = field_map.get(field.split(".")[-1] if "." in field else field, field)
        errors.append(f"{friendly_field}: {msg}")
    
    return JSONResponse(
        status_code=422,
        content={
            "detail": errors,
            "error_message": " ".join(errors) if errors else "Validation error"
        }
    )

# Mount static files for exports and media
app.mount("/exports", StaticFiles(directory=settings.EXPORTS_PATH), name="exports")
app.mount("/media", StaticFiles(directory=settings.MEDIA_PATH), name="media")

# Include routers
app.include_router(teacher.router, prefix=settings.API_PREFIX)
app.include_router(diet.router, prefix=settings.API_PREFIX)
app.include_router(lfa.router, prefix=settings.API_PREFIX)
app.include_router(webhook.router, prefix=settings.API_PREFIX)


@app.get("/")
def root():
    """Root endpoint."""
    return {
        "message": "EduPulse API",
        "version": settings.VERSION,
        "docs": "/docs"
    }


@app.get("/health")
def health_check():
    """Health check endpoint."""
    return {"status": "healthy", "version": settings.VERSION}


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)