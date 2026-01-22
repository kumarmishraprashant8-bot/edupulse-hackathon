# EduPulse — Hackathon MVP

**EduPulse** is a production-ready closed-loop teacher support system designed for low-bandwidth environments. Teachers submit classroom problems via WhatsApp or web chat and receive immediate, actionable micro-advice. DIET officers aggregate signals and generate targeted training micro-modules.

## 🚀 Quick Start

### Prerequisites

- **Backend**: Python 3.11+ with pip
- **Frontend**: Node.js 18+ with npm
- **Database**: SQLite (default) or PostgreSQL

### Backend Setup

#### Windows (PowerShell)

```powershell
cd backend
.\start.bat
```

Or manually:

```powershell
cd backend
python -m venv venv
.\venv\Scripts\Activate.ps1
pip install -r requirements.txt
$env:SECRET_SALT="changeme-in-production"
cd app
python -m uvicorn main:app --host 0.0.0.0 --port 8000 --reload
```

**Note**: If you get an execution policy error, run: `Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser`

#### Linux/macOS

```bash
cd backend
chmod +x run.sh
./run.sh
```

Or manually:

```bash
cd backend
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
export SECRET_SALT=changeme-in-production
cd app
python -m uvicorn main:app --host 0.0.0.0 --port 8000 --reload
```

**Backend will be available at**: `http://127.0.0.1:8000`
**API docs**: `http://127.0.0.1:8000/docs`

**Backend will be available at:** http://127.0.0.1:8000  
**API docs (Swagger):** http://127.0.0.1:8000/docs

### Frontend Setup

#### Windows (CMD/PowerShell)

```cmd
cd frontend\edupulse-ui
npm install
npm run dev
```

#### Linux/macOS

```bash
cd frontend/edupulse-ui
npm install
npm run dev
```

**Frontend will be available at:** http://localhost:5173

### Environment Variables

Create a `.env` file in the `backend` directory:

```env
SECRET_KEY=changeme-in-production-use-random-string
SECRET_SALT=changeme-in-production-use-random-string
DATABASE_URL=sqlite:///./edupulse.db
VITE_API_BASE_URL=http://127.0.0.1:8000
```

## 📊 Seeding Demo Data

### Seed Built-in Data (10-20 queries across 3 clusters)

#### Windows (CMD/PowerShell)

```cmd
cd backend
venv\Scripts\activate
python scripts\seed_demo_data.py
```

#### Linux/macOS

```bash
cd backend
source venv/bin/activate
python scripts/seed_demo_data.py
```

### Seed from CSV

```bash
python scripts/seed_demo_data.py --csv path/to/queries.csv
```

CSV format:
```csv
phone,cluster,topic,text,consent_given
+919876543210,Cluster A,subtraction-borrowing,Students confused about borrowing,true
```

## 📚 Generate Sample Module

Generate a sample PPTX module for testing:

#### Windows (CMD/PowerShell)

```cmd
cd backend
venv\Scripts\activate
python scripts\generate_sample_module.py --topic subtraction-borrowing
```

#### Linux/macOS

```bash
cd backend
source venv/bin/activate
python scripts/generate_sample_module.py --topic subtraction-borrowing
```

Output: `backend/templates/samples/subtraction-borrowing-module.pptx`

## 🎬 Demo Script (60-90 seconds)

### Step-by-Step Demo Flow

**0:00-0:05 — Landing**
- Show title "EduPulse" with gradient header
- Point out "MOCK MODE" badge if enabled
- Say: "EduPulse — real-time teacher support, faster training, and easy program design."

**0:05-0:25 — Teacher Flow (20s)**
- Click "Teacher Chat" tab (already selected)
- Show quick suggestion chips
- Click chip: "Students confused about subtraction borrowing"
- Fill in: Cluster (Cluster A), Phone optional
- Click "Get Advice" button
- Show optimistic skeleton loading
- Wait for AdviceCard to appear with animated entrance
- Read one line from the advice: "Try this 3-step pebble activity: Use 10 pebbles in groups..."
- Say: "Teachers get immediate, actionable advice in under 10 seconds. Phone numbers are hashed for privacy."

**0:25-0:50 — DIET Dashboard (25s)**
- Click "DIET Dashboard" tab
- Show aggregate charts (bar chart for topics, doughnut for clusters)
- Point to summary cards: "15 total queries, 7 topics, 3 clusters"
- Click on a topic bar in the chart
- Show modal with recent queries for that topic
- Click "Generate Module for This Topic"
- In Generate Module modal: Select template (Activity-Based), Grade (3), Language (English)
- Click "Generate"
- Show progress spinner
- Show download link appears
- Say: "DIET officers can see patterns across clusters and generate targeted training modules instantly."

**0:50-1:10 — LFA Wizard (20s)**
- Click "LFA Wizard" tab
- Click "📋 Load Example" button
- Show form pre-filled with example data
- Click "Next →" through steps (show progress bar advancing)
- On final step, click "👁️ Preview" to show summary
- Close preview, click "📥 Export PPTX"
- Show export success with download link
- Say: "Program design becomes simple with our 5-step LFA wizard. Export ready-to-use PPTX files."

**1:10-1:15 — Close (5s)**
- Return to landing
- Click Settings (⚙️) to show Mock Mode toggle
- Say: "EduPulse — real-time support, faster training, and easy program design. Ready for deployment in low-bandwidth environments with full offline mock mode support."

### Key Talking Points

1. **Privacy-first**: Phone numbers are hashed with SHA-256 + SECRET_SALT, never stored raw
2. **Instant responses**: Teachers get advice in under 10 seconds
3. **Data-driven**: DIET officers see aggregated patterns across clusters
4. **Offline-ready**: Works with minimal bandwidth, mock mode for development
5. **Demo-ready**: All flows work end-to-end with real PPTX generation

## 🔒 Privacy & Security

- **Phone Number Hashing**: All phone numbers are hashed using SHA-256 + `SECRET_SALT` before storage
- **No Raw Phone Storage**: Original phone numbers are never stored or logged
- **Consent Flow**: First-time users must provide explicit consent
- **Right to Deletion**: Teachers can delete their queries via DELETE endpoint
- **Ephemeral IDs**: If phone not provided, client generates ephemeral session ID

## 🧪 Running Tests

### Backend Tests

#### Windows (CMD/PowerShell)

```cmd
cd backend
venv\Scripts\activate
pytest tests\ -v
```

#### Linux/macOS

```bash
cd backend
source venv/bin/activate
pytest tests/ -v
```

### Frontend Tests

#### Windows (CMD/PowerShell)

```cmd
cd frontend\edupulse-ui
npm test
```

#### Linux/macOS

```bash
cd frontend/edupulse-ui
npm test
```

## 📡 API Endpoints

### Teacher Endpoints

**POST /api/teacher/query**
```bash
curl -X POST http://127.0.0.1:8000/api/teacher/query \
  -H "Content-Type: application/json" \
  -d '{
    "phone": "+919876543210",
    "cluster": "Cluster A",
    "topic": "subtraction-borrowing",
    "text": "Students confused about subtraction borrowing when there'\''s a zero in tens place",
    "consent_given": true
  }'
```

**GET /api/teacher/sample-response?topic=subtraction-borrowing**
```bash
curl http://127.0.0.1:8000/api/teacher/sample-response?topic=subtraction-borrowing
```

### DIET Endpoints

**GET /api/diet/aggregate**
```bash
curl "http://127.0.0.1:8000/api/diet/aggregate?cluster=Cluster%20A&topic=subtraction-borrowing"
```

**POST /api/diet/generate-module**
```bash
curl -X POST http://127.0.0.1:8000/api/diet/generate-module \
  -H "Content-Type: application/json" \
  -d '{
    "cluster": "Cluster A",
    "topic": "subtraction-borrowing",
    "template": "default"
  }'
```

### LFA Endpoints

**POST /api/lfa/export**
```bash
curl -X POST http://127.0.0.1:8000/api/lfa/export \
  -H "Content-Type: application/json" \
  -d '{
    "title": "FLN Intervention 2026",
    "problem_statement": "40% students below grade level",
    "student_change": "80% achieve grade-level numeracy",
    "stakeholders": ["Teachers", "CRPs", "Parents"],
    "practice_changes": ["Daily 15min number talks", "Concrete manipulatives"],
    "indicators": ["Pre/post test scores", "Attendance", "Parent engagement"]
  }'
```

## 📁 Project Structure

```
edupulse-mvp/
├── backend/
│   ├── app/                    # FastAPI application
│   │   ├── api/               # API endpoints
│   │   ├── services/          # Business logic
│   │   ├── utils/             # Utilities (privacy hashing)
│   │   └── main.py            # FastAPI app entry
│   ├── scripts/               # Utility scripts
│   │   ├── seed_demo_data.py  # Seed database
│   │   └── generate_sample_module.py  # Generate sample PPTX
│   ├── tests/                 # Backend tests
│   ├── start.bat              # Windows start script
│   ├── run.sh                 # Linux/macOS start script
│   └── requirements.txt       # Python dependencies
├── frontend/
│   └── edupulse-ui/           # React + Vite + TypeScript
│       ├── src/
│       │   ├── components/    # React components
│       │   ├── services/      # API client
│       │   ├── lib/          # Utilities (intent mapping)
│       │   ├── hooks/        # React hooks (offline cache)
│       │   └── mock/         # Mock data
│       └── package.json
└── README.md
```

## 🛠️ Development

### Teacher Flow Demo (60 seconds)

**Quick demo script for judges:**

1. **0-3s**: Landing — Open app, see "Teacher Chat — quick help in the classroom" header
2. **3-18s**: Click chip "Concept confusion" → Type "Students confused about subtraction borrowing" → Send → Advice card appears with "Try this in the next 10 minutes" title, script, and actions
3. **18-35s**: Click "Request Module" → Confirm grade (Grade 3) and language (English) → Generate → Download link appears
4. **35-50s**: Click "Flag to CRP" on advice card → Show DIET dashboard "Latest alerts" with flagged item
5. **50-60s**: Closing: "EduPulse — real-time help for teachers, data to power training"

**Run smoke test:**
```bash
# Linux/macOS
cd frontend/edupulse-ui
bash scripts/smoke-teacher.sh

# Windows
cd frontend\edupulse-ui
scripts\smoke-teacher.bat
```

### Mock Mode

The frontend supports **Mock Mode** for offline development. Enable it in Settings (⚙️ button):

- All API calls use local mock data from `src/mock/seed.json`
- Perfect for demos when backend is unavailable
- Shows "MOCK MODE" badge in header
- All features work with mock data
- **Auto-fallback**: After 2 consecutive network failures, automatically switches to Mock Mode

### Backend Development

```bash
cd backend
source venv/bin/activate  # or venv\Scripts\activate on Windows
pytest tests/ -v --cov=app
```

### Frontend Development

```bash
cd frontend/edupulse-ui
npm run dev
```

## 🎨 Features

### Teacher Chat (Theme 1 — Enhanced)
- **Chat-first UI**: Hero section with friendly header "Teacher Chat — quick help in the classroom"
- **Single-line input** with placeholder: "Describe the classroom problem in one sentence"
- **Quick chips**: Classroom management, Concept confusion, Student absenteeism, Parent engagement, Need TLMs
- **Voice input**: Web Speech API (mic icon, hidden if unavailable)
- **Optimistic updates**: Teacher message appears immediately on right with timestamp
- **Skeleton loaders**: Smooth loading animation on left where answer appears
- **Attachment support**: Image upload (JPG/PNG, max 500KB, auto-compressed if needed)
- **AdviceCard features**:
  - Humanized format: "Try this in the next 10 minutes" with 2-4 bullet actions
  - Copyable teacher script with "Copy script" button
  - Micro-learning card (30-60 second actionable steps)
  - Save note to IndexedDB
  - Flag to CRP (sends alert to DIET dashboard)
  - Request Module modal (grade + language selection)
  - Show similar queries (cluster-level count)
- **Offline resilience**: Auto-fallback to Mock Mode after 2 network failures
- **Privacy**: Phone hashing (SHA256) with demo salt, optional phone input

### DIET Dashboard
- Interactive charts (click bars to see queries)
- Cluster/topic filters and search
- Time period filters (7/30/90 days)
- Generate Module modal with template selection
- Module preview and download

### LFA Wizard
- 5-step guided wizard with progress bar
- Load example data button
- Inline tips for each step
- Preview modal before export
- Copy summary to clipboard
- Export PPTX with download link

## 🐛 Troubleshooting

**Backend won't start:**
- Check Python version: `python --version` (needs 3.11+)
- Verify dependencies: `pip install -r requirements.txt`
- Check port 8000 is available
- Ensure `SECRET_SALT` is set in environment

**Frontend won't connect to backend:**
- Verify backend is running at http://127.0.0.1:8000
- Check `VITE_API_BASE_URL` in `.env` or `vite.config.ts`
- Enable MOCK_MODE in Settings for offline development

**Tests failing:**
- Backend: Ensure `SECRET_SALT` is set in test environment
- Frontend: Run `npm install` to ensure all dependencies are installed

## 📄 License

This project is part of a hackathon MVP. See LICENSE file for details.

---

**Built for hackathons. Ready for pilots. Production-ready architecture.**
