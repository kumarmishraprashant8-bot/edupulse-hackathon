@echo off
REM Windows batch script to start EduPulse backend
echo Starting EduPulse Backend...

REM Check if venv exists
if not exist "venv" (
    echo Creating virtual environment...
    python -m venv venv
)

REM Activate venv
call venv\Scripts\activate.bat

REM Install/upgrade requirements
echo Installing requirements...
pip install --upgrade pip
pip install -r requirements.txt

REM Create necessary directories
if not exist "exports" mkdir exports
if not exist "media" mkdir media
if not exist "templates\samples" mkdir templates\samples

REM Load environment variables from .env if it exists
if exist ".env" (
    echo Loading .env file...
)

REM Start uvicorn
echo Starting FastAPI server...
echo.
echo Backend will be available at: http://127.0.0.1:8000
echo API docs available at: http://127.0.0.1:8000/docs
echo.
python -m uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload

pause
