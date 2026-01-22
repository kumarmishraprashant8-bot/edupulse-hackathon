#!/bin/bash
# Linux/mac script to start EduPulse backend

echo "Starting EduPulse Backend..."

# Check if venv exists
if [ ! -d "venv" ]; then
    echo "Creating virtual environment..."
    python3 -m venv venv
fi

# Activate venv
source venv/bin/activate

# Install/upgrade requirements
echo "Installing requirements..."
pip install --upgrade pip
pip install -r requirements.txt

# Create necessary directories
mkdir -p exports
mkdir -p media
mkdir -p templates/samples

# Load environment variables from .env if it exists
if [ -f ".env" ]; then
    echo "Loading .env file..."
    export $(cat .env | grep -v '^#' | xargs)
fi

# Start uvicorn
echo ""
echo "Backend will be available at: http://127.0.0.1:8000"
echo "API docs available at: http://127.0.0.1:8000/docs"
echo ""
python -m uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
