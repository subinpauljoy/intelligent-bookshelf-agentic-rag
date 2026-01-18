# Intelligent Book Management System

This is a comprehensive Book Management System featuring a FastAPI backend with PostgreSQL, and a React frontend. It integrates AI capabilities using Llama 3 via OpenRouter for generating book summaries.

Both the embedding logic and Inference are used via OpenRouter API. This has several major benefits for your project:

   1. Lightweight Container: The Docker image size is reduced from ~3GB to ~200MB because we no longer need PyTorch and CUDA.
   2. No Large Installs: You won't see any more NVIDIA/CUDA packages being downloaded during pip install.
   3. Scalability: Since the heavy lifting (vectorizing text) is now done by an API, your backend will consume very little CPU and RAM, making it perfect for AWS deployment.
   4. Consistency: We are now using the same API-based approach for both embeddings and the LLM (Llama3).

## Features

- **User Management**: Authentication and Authorization (JWT).
- **Book Management**: CRUD operations for books.
- **Reviews**: Add and view reviews for books.
- **AI Integration**: Auto-generate book summaries using Llama 3.
- **Responsive UI**: Built with React and Material UI.

## Prerequisites

- Docker and Docker Compose
- An OpenRouter API Key (for AI features)

## Deployment Steps

### 1. Clone the Repository

```bash
git clone <repository_url>
cd intelligent-book-management
```

### 2. Configuration

Create a `.env` file in the root directory or export the environment variables directly.

```bash
export OPENROUTER_API_KEY="your_openrouter_api_key_here"
```

You can also modify `backend/app/core/config.py` for default settings like database credentials if not using Docker Compose defaults.

### 3. Run with Docker Compose

Build and start the services:

```bash
docker-compose up --build
```

This will start:

- **Frontend**: <http://localhost:3000>
- **Backend API**: <http://localhost:8000>
- **PostgreSQL Database**: Port 5432

### 4. Database Migrations

The application uses Alembic for migrations. When running with Docker, migrations can be applied automatically or manually.

To run migrations manually inside the container:

```bash
docker-compose exec backend alembic upgrade head
```

### 5. Accessing the Application

1. Open <http://localhost:3000> in your browser.
2. Sign up/Login to access the dashboard.
3. Start adding books!

## API Documentation

Once the backend is running, you can access the interactive API docs at:

- Swagger UI: <http://localhost:8000/docs>
- ReDoc: <http://localhost:8000/redoc>

## Testing

To run backend tests:

```bash
docker-compose exec backend pytest
```
