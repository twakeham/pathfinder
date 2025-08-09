# Pathfinder — LLM Playground and Training Tool

A Django + DRF backend and React frontend for building and delivering AI-focused learning content. Instructors can create courses, modules, lessons, quizzes, and exercises with a clean, consistent authoring UI.

## Stack
- Backend: Python 3.10+, Django, Django REST Framework, Channels-ready
- Frontend: React 18, React Router
- DB: SQLite (dev). Postgres recommended for production

## Quick start (Windows PowerShell)

### Backend
1) Create a virtual environment and install deps

```powershell
cd D:\Pathfinder
python -m venv .venv
& .\.venv\Scripts\Activate.ps1
pip install -r backend\requirements.txt
```

2) Apply migrations

```powershell
cd .\backend
python manage.py migrate
```

3) (Optional) Create a superuser

```powershell
python manage.py createsuperuser
```

4) (Optional) Seed demo data

These commands add a demo AI course and sample prompt templates.

```powershell
python manage.py seed_demo_ai_course
python manage.py seed_demo_prompts
python manage.py seed_course_prompt_collection
```

5) Run the dev server

```powershell
python manage.py runserver
```

By default the backend runs on http://127.0.0.1:8000.

### Frontend
1) Install dependencies

```powershell
cd D:\Pathfinder\frontend
npm install
```

2) Start the React dev server

```powershell
npm start
```

The app runs on http://localhost:3000.

## Key features (implemented)
- Course, Module, Lesson management with drag-and-drop ordering and publish toggles
- Quiz builder
  - Create and edit quizzes per lesson
  - Inline question authoring (MCQ and Short Answer)
  - Add/delete/reorder questions; choice management with order persistence
  - Options: attempts allowed, time limit, instructions, randomize, show results, questions to show
- Authoring UX
  - Stable header actions, unsaved-changes prompts
  - Consistent pill-style toggles
  - Breadcrumbs placed under page titles across editors

## Project layout
```
backend/        # Django project (apps: authentication, courses, chat, ai_models, analytics)
frontend/       # React app (src/components/Instructor/*, Auth, Profile)
docs/           # PRD, tasks, setup docs
scripts/        # Utility scripts
```

## Configuration
- Dev DB: SQLite file in `backend/` (default). For Postgres, update `backend/config/settings.py`.
- Environment variables: create `backend/.env` (optional) for SECRET_KEY, DEBUG, database URL, etc.
- CORS/CSRF: configured in settings for local dev; adjust for production.

## Media files
- Uploaded media is stored under `backend/media/` and is ignored by Git.
- For production, configure a proper media storage (S3, Azure Blob, etc.).

## Testing
- Backend tests live under each app’s `tests.py`.
- Frontend tests live under `frontend/src/**/*.test.js`.

## Notes
- Instructor area routes: `/instructor/courses`, `/instructor/courses/:id/edit`, `/instructor/modules/:id/edit`, `/instructor/lessons/:id/edit`, `/instructor/quizzes/:id/edit`.
- If you change schema/models, run migrations and restart the backend.
- Ensure the backend is running before using the instructor UI.
