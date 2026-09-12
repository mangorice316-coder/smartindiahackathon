# Deployment Guide

## 1. Prerequisites

- **Python**: 3.10, 3.11, 3.12, 3.13, or 3.14
- **Node.js**: 18.x, 20.x, or 22.x (with npm)
- **Operating System**: Windows, Linux (Ubuntu/Debian), or macOS

---

## 2. Quick Start (Local Development)

### Step 1: Clone Repository
```bash
git clone https://github.com/mangorice316-coder/smartindiahackathon.git
cd smartindiahackathon
```

### Step 2: Backend Setup
```bash
cd backend
python -m venv venv

# Windows:
.\venv\Scripts\activate
# Linux/macOS:
# source venv/bin/activate

pip install -r requirements.txt
```

### Step 3: Initialize Database & Offline ML Pipeline
```bash
# Compile certified 5-tier training dataset:
python -m app.pipeline.dataset_builder

# Execute offline model training and serialize checkpoint:
python -m app.pipeline.train_versioned_model

# Run automated test suite:
python -m pytest tests/ -v
```

### Step 4: Launch FastAPI Server
```bash
uvicorn main:app --host 0.0.0.0 --port 8000 --reload
```

### Step 5: Frontend Setup & Launch
In a separate terminal:
```bash
cd ../frontend
npm install
npm run dev
```

Open your browser at `http://localhost:5173`.

---

## 3. Production Build

```bash
# Build optimized frontend bundle:
cd frontend
npm run build

# Serve production assets via FastAPI static mount or Nginx reverse proxy:
uvicorn main:app --host 0.0.0.0 --port 8000 --workers 4
```\n