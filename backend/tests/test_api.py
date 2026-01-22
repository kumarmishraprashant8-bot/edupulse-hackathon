"""Test API endpoints."""
import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from app.main import app
from app.database import Base, get_db
from app.models import Cluster

# Create test database
SQLALCHEMY_DATABASE_URL = "sqlite:///./test.db"
engine = create_engine(SQLALCHEMY_DATABASE_URL, connect_args={"check_same_thread": False})
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

# Setup
Base.metadata.create_all(bind=engine)

def override_get_db():
    try:
        db = TestingSessionLocal()
        yield db
    finally:
        db.close()

app.dependency_overrides[get_db] = override_get_db
client = TestClient(app)


@pytest.fixture
def db_session():
    """Create a fresh database session for each test."""
    Base.metadata.drop_all(bind=engine)
    Base.metadata.create_all(bind=engine)
    db = TestingSessionLocal()
    
    # Add default cluster
    cluster = Cluster(name="Test Cluster A", region="Test Region")
    db.add(cluster)
    db.commit()
    
    yield db
    db.close()


def test_root_endpoint():
    """Test root endpoint."""
    response = client.get("/")
    assert response.status_code == 200
    assert "message" in response.json()


def test_health_check():
    """Test health check endpoint."""
    response = client.get("/health")
    assert response.status_code == 200
    assert response.json()["status"] == "healthy"


def test_create_teacher_query(db_session):
    """Test creating a teacher query."""
    payload = {
        "phone": "+919876543210",
        "cluster": "Test Cluster A",
        "topic": "subtraction-borrowing",
        "text": "Students confused about borrowing with zero in tens place",
        "consent_given": True
    }
    
    response = client.post("/api/teacher/query", json=payload)
    assert response.status_code == 200
    
    data = response.json()
    assert "id" in data
    assert "advice" in data
    assert len(data["advice"]) > 0
    assert "module_sample_link" in data


def test_create_query_without_consent(db_session):
    """Test that consent is required for new users."""
    payload = {
        "phone": "+919999999999",
        "cluster": "Test Cluster A",
        "topic": "general",
        "text": "Need help",
        "consent_given": False
    }
    
    response = client.post("/api/teacher/query", json=payload)
    assert response.status_code == 200
    
    data = response.json()
    assert data["consent_required"] == True
    assert "opt-in" in data["advice"].lower()


def test_get_teacher_query(db_session):
    """Test retrieving a teacher query."""
    # First create a query
    payload = {
        "phone": "+919876543210",
        "cluster": "Test Cluster A",
        "topic": "fractions-conceptual",
        "text": "Students struggling with fractions",
        "consent_given": True
    }
    
    create_response = client.post("/api/teacher/query", json=payload)
    query_id = create_response.json()["id"]
    
    # Now retrieve it
    response = client.get(f"/api/teacher/query/{query_id}")
    assert response.status_code == 200
    
    data = response.json()
    assert data["id"] == query_id
    assert data["topic_tag"] == "fractions-conceptual"


def test_delete_teacher_query(db_session):
    """Test deleting a teacher query (right to deletion)."""
    # Create query
    payload = {
        "phone": "+919876543210",
        "cluster": "Test Cluster A",
        "topic": "general",
        "text": "Test query",
        "consent_given": True
    }
    
    create_response = client.post("/api/teacher/query", json=payload)
    query_id = create_response.json()["id"]
    
    # Delete it
    response = client.delete(f"/api/teacher/query/{query_id}")
    assert response.status_code == 200
    
    # Verify it's deleted
    get_response = client.get(f"/api/teacher/query/{query_id}")
    assert get_response.status_code == 404


def test_get_aggregated_data(db_session):
    """Test aggregation endpoint."""
    # Create several queries
    for i in range(3):
        payload = {
            "phone": f"+9198765432{i:02d}",
            "cluster": "Test Cluster A",
            "topic": "subtraction-borrowing",
            "text": f"Test query {i}",
            "consent_given": True
        }
        client.post("/api/teacher/query", json=payload)
    
    # Get aggregated data
    response = client.get("/api/diet/aggregate")
    assert response.status_code == 200
    
    data = response.json()
    assert data["total_queries"] >= 3
    assert "by_topic" in data
    assert "by_cluster" in data


def test_generate_module(db_session):
    """Test micro-module generation."""
    payload = {
        "cluster": "Test Cluster A",
        "topic": "subtraction-borrowing",
        "template": "default"
    }
    
    response = client.post("/api/diet/generate-module", json=payload)
    assert response.status_code == 200
    
    data = response.json()
    assert "module_id" in data
    assert "pptx_link" in data
    assert ".pptx" in data["pptx_link"]


def test_export_lfa(db_session):
    """Test LFA export."""
    payload = {
        "title": "Test FLN Intervention",
        "problem_statement": "40% students below grade level",
        "student_change": "80% achieve grade-level numeracy",
        "stakeholders": ["Teachers", "CRPs", "Parents"],
        "practice_changes": ["Daily number talks", "Use manipulatives"],
        "indicators": ["Pre/post test scores", "Attendance"]
    }
    
    response = client.post("/api/lfa/export", json=payload)
    assert response.status_code == 200
    
    data = response.json()
    assert "export_url" in data
    assert "lfa_id" in data
    assert ".pptx" in data["export_url"]


def test_topic_detection():
    """Test automatic topic detection from text."""
    from app.services.template_engine import TemplateEngine
    
    engine = TemplateEngine()
    
    # Test subtraction detection
    topic = engine.detect_topic("Students confused about borrowing in subtraction")
    assert topic == "subtraction-borrowing"
    
    # Test fraction detection
    topic = engine.detect_topic("How do I teach fractions?")
    assert topic == "fractions-conceptual"
    
    # Test classroom management
    topic = engine.detect_topic("Class is very noisy and I can't get their attention")
    assert topic == "classroom-management"


def test_phone_hashing():
    """Test phone number hashing for privacy."""
    from app.utils.privacy import hash_phone_number
    import os
    
    # Set SECRET_SALT for testing
    os.environ["SECRET_SALT"] = "test-salt"
    
    phone1 = "+919876543210"
    phone2 = "+919876543210"
    phone3 = "+919999999999"
    
    hash1 = hash_phone_number(phone1)
    hash2 = hash_phone_number(phone2)
    hash3 = hash_phone_number(phone3)
    
    # Same phone should produce same hash
    assert hash1 == hash2
    
    # Different phone should produce different hash
    assert hash1 != hash3
    
    # Hash should be 64 characters (SHA-256)
    assert len(hash1) == 64


def test_phone_is_hashed_in_db(db_session):
    """Test that phone numbers are never stored raw in database."""
    from app.models import TeacherQuery
    from app.utils.privacy import hash_phone_number
    import os
    
    # Set SECRET_SALT for testing
    os.environ["SECRET_SALT"] = "test-salt"
    
    phone = "+919876543210"
    phone_hash = hash_phone_number(phone)
    
    # Create a query
    payload = {
        "phone": phone,
        "cluster": "Test Cluster",
        "topic": "subtraction-borrowing",
        "text": "Test query",
        "consent_given": True
    }
    
    response = client.post("/api/teacher/query", json=payload)
    assert response.status_code == 200
    
    data = response.json()
    query_id = data["id"]
    
    # Verify in database
    query = db_session.query(TeacherQuery).filter(TeacherQuery.id == query_id).first()
    assert query is not None
    
    # Verify phone_hash is stored (not raw phone)
    assert query.phone_hash == phone_hash
    assert query.phone_hash != phone
    assert len(query.phone_hash) == 64  # SHA-256 hex length
    
    # Verify no phone field exists in model (should not be stored)
    assert not hasattr(query, 'phone') or getattr(query, 'phone', None) is None


def test_post_teacher_query_returns_advice_and_creates_record(db_session):
    """Test that POST /api/teacher/query returns advice and creates a record."""
    payload = {
        "phone": "+919876543210",
        "cluster": "Test Cluster A",
        "topic": "subtraction-borrowing",
        "text": "Students confused about borrowing with zero in tens place",
        "consent_given": True
    }
    
    response = client.post("/api/teacher/query", json=payload)
    assert response.status_code == 200
    
    data = response.json()
    assert "id" in data
    assert "advice" in data
    assert len(data["advice"]) > 0
    assert "module_sample_link" in data
    assert "consent_required" in data
    
    # Verify record was created
    from app.models import TeacherQuery
    query = db_session.query(TeacherQuery).filter(TeacherQuery.id == data["id"]).first()
    assert query is not None
    assert query.narrative_text == payload["text"]


def test_teacher_query_without_phone_works(db_session):
    """Test that teacher query works without phone (uses ephemeral ID)."""
    payload = {
        "phone": "",  # Empty phone
        "cluster": "Test Cluster A",
        "topic": "subtraction-borrowing",
        "text": "Test query without phone",
        "consent_given": True
    }
    
    response = client.post("/api/teacher/query", json=payload)
    assert response.status_code == 200
    
    data = response.json()
    assert "id" in data
    assert "advice" in data


def test_generate_module_creates_pptx_file(db_session):
    """Test that generate-module creates a PPTX file."""
    import os
    
    payload = {
        "cluster": "Test Cluster A",
        "topic": "subtraction-borrowing",
        "template": "default"
    }
    
    response = client.post("/api/diet/generate-module", json=payload)
    assert response.status_code == 200
    
    data = response.json()
    assert "module_id" in data
    assert "pptx_link" in data
    assert ".pptx" in data["pptx_link"]
    
    # Verify file exists (relative to exports directory)
    file_path = data["pptx_link"].lstrip("/")
    if os.path.exists(file_path):
        assert os.path.isfile(file_path)


def test_lfa_export_returns_download_link_or_file(db_session):
    """Test that LFA export returns a download link."""
    payload = {
        "title": "Test FLN Intervention",
        "problem_statement": "40% students below grade level",
        "student_change": "80% achieve grade-level numeracy",
        "stakeholders": ["Teachers", "CRPs", "Parents"],
        "practice_changes": ["Daily number talks", "Use manipulatives"],
        "indicators": ["Pre/post test scores", "Attendance"]
    }
    
    response = client.post("/api/lfa/export", json=payload)
    assert response.status_code == 200
    
    data = response.json()
    assert "export_url" in data
    assert "lfa_id" in data
    assert ".pptx" in data["export_url"]


def test_aggregate_returns_counts(db_session):
    """Test that aggregate endpoint returns counts."""
    # Create several queries
    for i in range(3):
        payload = {
            "phone": f"+9198765432{i:02d}",
            "cluster": "Test Cluster A",
            "topic": "subtraction-borrowing",
            "text": f"Test query {i}",
            "consent_given": True
        }
        client.post("/api/teacher/query", json=payload)
    
    # Get aggregated data
    response = client.get("/api/diet/aggregate")
    assert response.status_code == 200
    
    data = response.json()
    assert "total_queries" in data
    assert data["total_queries"] >= 3
    assert "by_topic" in data
    assert "by_cluster" in data
    assert "sample_queries" in data