# PRD Log - llm-playground-mvp

## 2025-08-08

1.0.1 Created task list from PRD - Generated comprehensive implementation task list based on MVP PRD requirements - `llm-playground-mvp-tasks.md`
1.1 Completed subtask 1.1 - Initialized Django project skeleton with config module and manage.py; added requirements.txt; verified Django check - Files: `backend/manage.py`, `backend/config/__init__.py`, `backend/config/settings.py`, `backend/config/urls.py`, `backend/config/wsgi.py`, `backend/config/asgi.py`, `backend/requirements.txt`
1.2 Completed subtask 1.2 - Configured PostgreSQL settings via environment variables; installed psycopg binary; validated with manage.py check - Files: `backend/config/settings.py`, `backend/requirements.txt`
1.3 Completed subtask 1.3 - Created Django apps (authentication, courses, chat, ai_models, analytics) and added to INSTALLED_APPS - Files: `backend/authentication/`, `backend/courses/`, `backend/chat/`, `backend/ai_models/`, `backend/analytics/`, `backend/config/settings.py`
1.4 Completed subtask 1.4 - Configured CORS/CSRF and security settings; added django-cors-headers; updated requirements - Files: `backend/config/settings.py`, `backend/requirements.txt`
1.5 Completed subtask 1.5 - Installed DRF and SimpleJWT; added authentication routes (`/api/auth/token`, `/api/auth/token/refresh`); configured REST_FRAMEWORK and JWT settings - Files: `backend/config/settings.py`, `backend/config/urls.py`, `backend/authentication/urls.py`, `backend/requirements.txt`
1.6 Completed subtask 1.6 - Installed Channels and channels-redis; configured ASGI router and channel layer; updated settings and requirements - Files: `backend/config/settings.py`, `backend/config/asgi.py`, `backend/requirements.txt`
1.7 Completed subtask 1.7 - Consolidated backend requirements (Django, psycopg, cors, DRF, SimpleJWT, Channels, channels-redis, Daphne); installed successfully - Files: `backend/requirements.txt`
1.8 Completed subtask 1.8 - Added python-dotenv; auto-load .env; created `.env.example`; DEBUG/DEV from env; SQLite toggled via DEV - Files: `backend/config/settings.py`, `backend/requirements.txt`, `backend/.env.example`
1.9 Completed subtask 1.9 - Created React app (CRA PWA), resolved React 19 peer issues by pinning React 18; added root dev runner with concurrently; installed deps - Files: `frontend/`, `frontend/package.json`, `package.json`
1.10 Completed subtask 1.10 - Added CRA dev proxy to frontend package.json; documented dev setup commands - Files: `frontend/package.json`, `docs/DEV-SETUP.md`
1.11 Completed subtask 1.11 - Added GitHub Actions for backend and frontend CI (install, check/migrate, build) - Files: `.github/workflows/backend-ci.yml`, `.github/workflows/frontend-ci.yml`
1.12 Skipped subtask 1.12 - Skipped generating setup/config tests per user request - Files: (none)
2.1 Completed subtask 2.1 - Implemented custom User model extending AbstractUser with role field; set AUTH_USER_MODEL and registered admin - Files: `backend/authentication/models.py`, `backend/authentication/admin.py`, `backend/config/settings.py`, `docs/llm-playground-mvp/llm-playground-mvp-tasks.md`
2.2 Completed subtask 2.2 - Added registration endpoint requiring admin approval; wired route; basic validation - Files: `backend/authentication/views.py`, `backend/authentication/urls.py`, `backend/authentication/admin.py`
2.3 Completed subtask 2.3 - Frontend login page integrated with backend JWT token endpoint - Files: `frontend/src/components/Auth/Login.js`, `frontend/src/App.js`, `docs/llm-playground-mvp/llm-playground-mvp-tasks.md`
2.9 Completed subtask 2.9 - Added frontend registration (Register.js), wired toggle between Login/Register in App and Login; updated tasks - Files: `frontend/src/components/Auth/Register.js`, `frontend/src/components/Auth/Login.js`, `frontend/src/App.js`, `docs/llm-playground-mvp/llm-playground-mvp-tasks.md`
3.8.4 Implemented - Added Module Manager beneath Course metadata in the editor: list/create/edit/delete, drag-and-drop reordering with persistent order (PATCH). Wired to API (`GET /api/courses/courses/:id/modules/`, `POST/PATCH/DELETE /api/courses/modules/`). Files modified: `frontend/src/components/Instructor/CourseEditor.js`, `docs/llm-playground-mvp/llm-playground-mvp-tasks.md`
3.8.6 Completed - Implemented Content Block editor within Module Editor: per-lesson blocks list/create/edit/delete, drag-and-drop order with auto-persist, publish toggle, and inline previews for Text/Image/Code/Video/Prompt types. Updated tasks checklist. Files modified: `frontend/src/components/Instructor/ModuleEditor.js`, `docs/llm-playground-mvp/llm-playground-mvp-tasks.md`

## 2025-08-09

3.8.7.7 Implemented - Added Quizzes manager card to Lesson Editor: list quizzes for lesson, create with modal, delete with confirm, drag-and-drop reordering with persistent PATCH on order. Files modified: `frontend/src/components/Instructor/LessonEditor.js`
3.8.7 scaffolding - Added Quiz Editor placeholder and route so navigation from Quizzes list works. Files added/modified: `frontend/src/components/Instructor/QuizEditor.js`, `frontend/src/App.js`
Hotfix - Made `attempts_allowed` on Quiz nullable to avoid 500 on quiz creation; exposed new Quiz/Question fields in serializers. Files: `backend/courses/models.py`, `backend/courses/serializers.py`, migration `courses/0008_alter_quiz_attempts_allowed.py`
UI Polish - QuizEditor inline question editor: removed footer Cancel/Save, moved Save to header as green ✓ between Cancel Edit and Delete; standardized glyph size. File: `frontend/src/components/Instructor/QuizEditor.js`
3.8.7 enhancement - Added per-attempt question limit setting: introduced `questions_to_show` on Quiz (nullable), created migration `courses/0009_quiz_questions_to_show.py`, exposed in serializer, surfaced numeric input in Quiz options, and included in save payload. Files: `backend/courses/models.py`, `backend/courses/serializers.py`, `backend/courses/migrations/0009_quiz_questions_to_show.py`, `frontend/src/components/Instructor/QuizEditor.js`
