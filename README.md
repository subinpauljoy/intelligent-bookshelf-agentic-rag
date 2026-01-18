# Intelligent Book Management System (RAG 2.0)

A sophisticated Book Management System featuring a FastAPI backend, React frontend, and a **Multi-Agent RAG (Retrieval-Augmented Generation) System** powered by Llama 3 via OpenRouter.

## 🚀 Advanced Features (RAG 2.0)

- **Context-Aware Multi-Agent Chat**: 
    - **Router Agent**: Automatically detects user intent (Metadata vs. Content vs. Out-of-scope).
    - **Guardrails**: Prevents non-book related queries with helpful deflections.
    - **Metadata Search**: Handles queries like "List 5 fantasy books" by querying SQL directly.
    - **Semantic Search**: Uses pgvector to answer deep-dive content questions.
- **Smart Ingestion Pipeline**:
    - **Metadata Linkage**: Documents are linked to specific books.
    - **Auto-Summarization**: Generating a document ingestion automatically updates the book's AI summary in the library.
- **Review Analytics**:
    - **Sentiment Summary**: AI aggregates all user reviews into a concise sentiment analysis.
    - **Semantic Recommendations**: A "User Taste Vector" is built from your high-rated reviews to suggest new books semantically similar to your preferences.
- **Responsive UI**: Modern Material UI dashboard with optimized mobile/tablet views.

## 🛠️ Tech Stack

- **Backend**: FastAPI, SQLAlchemy (Async), PostgreSQL + pgvector.
- **AI/LLM**: Llama 3 (Inference) & OpenAI (Embeddings) via OpenRouter API.
- **Frontend**: React (Vite, TypeScript), Material UI v7.
- **DevOps**: Docker, Docker Compose, Alembic.

## 📋 Prerequisites

- Docker and Docker Compose.
- An **OpenRouter API Key**.

## ⚙️ Setup & Deployment

### 1. Clone & Configure
```bash
git clone <repository_url>
cd intelligent-book-management
```
Create a `.env` file in the root with:
```env
OPENROUTER_API_KEY=your_key_here
POSTGRES_PASSWORD=password
```

### 2. Run with Docker Compose
```bash
docker-compose up --build
```
- **Frontend**: http://localhost:3000
- **Backend**: http://localhost:8000
- **Database**: Port 5432 (PostgreSQL + pgvector)

### 3. Initialize Database & Admin
Apply migrations and promote your first user:
```bash
docker-compose exec backend alembic upgrade head
# Register a user in the UI first, then:
docker-compose exec backend python scripts/promote_user.py
```

## ☁️ AWS Production Architecture

For a scalable AWS deployment, we recommend:
- **RDS for PostgreSQL**: High-availability database with `pgvector` enabled.
- **ECS Fargate**: Serverless container execution for the lightweight FastAPI backend.
- **S3 + CloudFront**: Scalable static hosting for the React frontend.
- **Secrets Manager**: Secure storage for the OpenRouter API Key.

## 🧪 Testing
```bash
docker-compose exec backend pytest
```