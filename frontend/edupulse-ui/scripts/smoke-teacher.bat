@echo off
REM Smoke test for teacher query endpoint (Windows)
REM Usage: scripts\smoke-teacher.bat

setlocal

set API_BASE_URL=%VITE_API_BASE_URL%
if "%API_BASE_URL%"=="" set API_BASE_URL=http://127.0.0.1:8000
set ENDPOINT=%API_BASE_URL%/api/teacher/query

echo 🧪 EduPulse Teacher Query Smoke Test
echo ======================================
echo Testing endpoint: %ENDPOINT%
echo.

REM Test 1: Basic query submission
echo Test 1: Submitting a sample teacher query...
curl -X POST "%ENDPOINT%" ^
  -H "Content-Type: application/json" ^
  -d "{\"cluster\": \"Cluster A\", \"topic\": \"subtraction-borrowing\", \"text\": \"Students confused about subtraction borrowing when there is a zero in tens place\", \"consent_given\": true}"

if %ERRORLEVEL% EQU 0 (
    echo.
    echo ✅ Request successful
    echo.
    echo ✅ All smoke tests passed!
) else (
    echo.
    echo ❌ Request failed
    exit /b 1
)

