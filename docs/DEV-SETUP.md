# Build and run the project locally

# Backend (Django)
- Create a Python virtual environment (already configured at `.venv`).
- Copy `backend/.env.example` to `backend/.env` and set values.
- For local dev with SQLite, set `DJANGO_DEV=true` in `.env`.
- Install Python deps:
  - Windows PowerShell:
    - `d:\Pathfinder\.venv\Scripts\python.exe -m pip install -r backend/requirements.txt`
- Run migrations:
  - `set DJANGO_DEV=1; d:\Pathfinder\.venv\Scripts\python.exe backend/manage.py migrate`
- Start backend:
  - `d:\Pathfinder\.venv\Scripts\python.exe backend/manage.py runserver`

# Frontend (React)
- From project root, install dev tool and frontend deps:
  - `npm install` (root)
  - `cd frontend && npm install`
- Start frontend:
  - `npm run frontend` (from project root)

# Run both concurrently
- From project root:
  - `npm run dev`

# Production build (frontend)
- `cd frontend && npm run build`
- Serve `frontend/build` via a static file server or configure Django to serve in production.

# Project CLI (recommended)
- Windows PowerShell examples:
  - Run backend (SQLite dev): `python scripts/pf.py backend --dev`
  - Run frontend: `python scripts/pf.py frontend`
  - Run both: `python scripts/pf.py dev`
  - Install deps (backend+frontend): `python scripts/pf.py install all`
  - Migrate DB: `python scripts/pf.py migrate`
