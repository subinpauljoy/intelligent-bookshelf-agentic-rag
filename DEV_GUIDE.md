# Local Development Guide

Follow these steps to run the application in development mode with hot-reloading.

## 1. Start the Database
Use Docker Compose to run **only** the PostgreSQL service.
```bash
# In the root 'intelligent-book-management' directory
docker-compose up -d db
```

## 2. Setup the Backend
Open a new terminal and navigate to the `backend` folder.

### Install Dependencies
It's recommended to use a virtual environment.
```bash
cd backend
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
```

### Configure Environment
Export your OpenRouter API Key and set the DB host to `localhost`.
```bash
export OPENROUTER_API_KEY="your_api_key_here"
export POSTGRES_SERVER="localhost"
```

### Initialize Database
Run the script to enable the vector extension and apply migrations.
```bash
python init_db.py
alembic revision --autogenerate -m "Initial migration"
alembic upgrade head
```

### Run the Server
```bash
uvicorn main:app --reload
```
The backend will be available at: http://localhost:8000

---

## 3. Setup the Frontend
Open another terminal and navigate to the `frontend` folder.

### Install & Run
```bash
cd frontend
npm install
npm run dev
```
The frontend will be available at: http://localhost:5173 (or as shown in the console).

---

## Troubleshooting
- **Backend container exit**: Check the logs using `docker-compose logs backend`. It usually fails if `OPENROUTER_API_KEY` is missing or the DB is not ready.
- **DB Connection**: Ensure `POSTGRES_SERVER` is `localhost` when running the app locally, but `db` when running inside Docker.
