# Intelligent Book Management System - Implementation Plan

## Phase 1: Backend Setup & Core Architecture
- [x] **Project Structure**: Initialize directory structure for backend and frontend.
- [x] **Dependencies**: Create `requirements.txt` with FastAPI, SQLAlchemy, AsyncPG, Pydantic, etc.
- [x] **Configuration**: Implement `app/core/config.py` for environment variables and settings.
- [x] **Database Connectivity**: Setup `app/db/session.py` and `app/db/base.py` for async database connection.
- [x] **Data Models (SQLAlchemy)**:
    - [x] User Model (`app/models/user.py`)
    - [x] Book Model (`app/models/book.py`)
    - [x] Review Model (`app/models/review.py`)
- [x] **Pydantic Schemas**:
    - [x] User Schemas (`app/schemas/user.py`)
    - [x] Book Schemas (`app/schemas/book.py`)
    - [x] Review Schemas (`app/schemas/review.py`)
    - [x] Token/Auth Schemas

## Phase 2: Security & Authentication
- [x] **Password Hashing**: Implement utility for hashing and verifying passwords (`app/core/security.py`).
- [x] **JWT Tokens**: Create functions to create access tokens.
- [x] **Auth Dependencies**: Implement `get_current_user` dependency for route protection.
- [x] **Login Endpoint**: Create `/login` route.

## Phase 3: Core Business Logic (CRUD)
- [x] **User Service**: Implement CRUD for Users.
- [x] **Book Service**: Implement CRUD for Books.
- [x] **Review Service**: Implement CRUD for Reviews.
- [x] **API Routers**:
    - [x] Users Router
    - [x] Books Router
    - [x] Reviews Router
- [x] **Main Application**: Setup `main.py` with FastAPI app and router inclusion.

## Phase 4: AI/LLM Integration (Llama3 via OpenRouter)
- [x] **LLM Service**: Create a service to interact with OpenRouter API.
- [x] **Summarization**: Implement logic to summarize book content.

## Phase 5: Frontend (React) - Initial
- [x] **Scaffolding**: Initialize React app with Vite/CRA.
- [x] **Routing**: Setup React Router.
- [x] **State Management**: Choose context or state library.
- [x] **UI Components**:
    - [x] Authentication Forms (Login/Signup)

## Phase 6: DevOps & Deployment
- [x] **Docker**: Create `Dockerfile` for backend and frontend.
- [x] **Docker Compose**: Orchestrate services (Backend, Frontend, DB) with `docker-compose.yml`.
- [x] **Testing**: Write unit and integration tests.
- [x] **Documentation**: Write comprehensive `README.md` and deployment guide.

## Phase 7: RAG & Advanced Features (Backend)
- [ ] **Database Upgrade**: Switch to `pgvector` image.
- [ ] **RAG Models**: Create `Document` and `DocumentChunk` (vector) models.
- [ ] **Ingestion Service**: Implement file parsing (PDF/Text) and embedding generation.
- [ ] **RAG API**:
    - [ ] Document Upload Endpoint
    - [ ] Ingestion Trigger Endpoint
    - [ ] Q&A/Chat Endpoint
- [ ] **User Management API**: Ensure endpoints support role updates (already in `crud_user`, need verification).

## Phase 8: Frontend Expansion
- [ ] **Sign Up Page**: Implement `SignUp.tsx`.
- [ ] **User Management**: Create `UserManagement.tsx` for Admin to manage users.
- [ ] **Document Management**: Create `DocumentManager.tsx` for upload/ingest.
- [ ] **Q&A Interface**: Create `ChatInterface.tsx`.
- [ ] **Navigation**: Add proper navigation bar for these new features.