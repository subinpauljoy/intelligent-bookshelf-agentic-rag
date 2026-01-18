# Local Development Guide

Follow these steps for rapid development with hot-reloading.

## 1. Start the Database
Run **only** the PostgreSQL service via Docker.
```bash
docker-compose up -d db
```

## 2. Setup the Backend
Navigate to the `backend` folder.

### Install
```bash
cd backend
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
```

### Environment
Ensure your `.env` is in the root directory or export the key:
```bash
export OPENROUTER_API_KEY="your_api_key"
export POSTGRES_SERVER="localhost"
```

### Database Initialization
```bash
# Apply migrations to create tables and pgvector extension
alembic upgrade head

# Create an admin (Register in the UI at http://localhost:5173/signup first)
python scripts/promote_user.py
```

### Run
```bash
uvicorn main:app --reload
```
API Docs: http://localhost:8000/docs

---

## 3. Setup the Frontend
Navigate to the `frontend` folder.

### Run
```bash
cd frontend
npm install
npm run dev
```
The app will be available at: http://localhost:5173

---

## 🛠️ Common Fixes

- **pgvector Import Errors**: The migration template has been updated. If you generate a new migration and see `NameError: pgvector`, ensure `import pgvector` is at the top of the generated file.
- **CORS Issues**: The backend is configured to allow `localhost:5173`. If you change the frontend port, update `BACKEND_CORS_ORIGINS` in `app/core/config.py`.
- **Password Length**: We use SHA-256 pre-hashing, so you can use passwords of any length safely.