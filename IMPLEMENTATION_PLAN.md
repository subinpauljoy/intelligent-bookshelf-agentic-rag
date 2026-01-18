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
- [ ] **Pydantic Schemas**:
    - [x] User Schemas (`app/schemas/user.py`)
    - [x] Book Schemas (`app/schemas/book.py`)
    - [x] Review Schemas (`app/schemas/review.py`)
    - [x] Token/Auth Schemas

## Phase 2: Security & Authentication
- [x] **Password Hashing**: Implement utility for hashing and verifying passwords (`app/core/security.py`).
- [x] **JWT Tokens**: Create functions to create access tokens.
- [x] **Auth Dependencies**: Implement `get_current_user` dependency for route protection.
- [ ] **Login Endpoint**: Create `/login` route.

## Phase 3: Core Business Logic (CRUD)
- [x] **User Service**: Implement CRUD for Users.
- [x] **Book Service**: Implement CRUD for Books.
- [x] **Review Service**: Implement CRUD for Reviews.
- [ ] **API Routers**:
    - [ ] Users Router
    - [ ] Books Router
    - [ ] Reviews Router
- [ ] **Main Application**: Setup `main.py` with FastAPI app and router inclusion.

## Phase 4: AI/LLM Integration (Llama3 via OpenRouter)
- [ ] **LLM Service**: Create a service to interact with OpenRouter API.
- [ ] **Summarization**: Implement logic to summarize book content.
- [ ] **Recommendations**: Implement basic recommendation logic (hybrid or content-based).
- [ ] **Integration**: Connect LLM service to Book creation/update flows.

## Phase 5: Frontend (React)
- [ ] **Scaffolding**: Initialize React app with Vite/CRA.
- [ ] **Routing**: Setup React Router.
- [ ] **State Management**: Choose context or state library.
- [ ] **UI Components**:
    - [ ] Authentication Forms (Login/Signup)
    - [ ] Dashboard/Layout
    - [ ] Book List & Details
    - [ ] Add/Edit Book Forms
    - [ ] Chat/Q&A Interface
- [ ] **API Integration**: Connect frontend to FastAPI backend.

## Phase 6: DevOps & Deployment
- [ ] **Docker**: Create `Dockerfile` for backend and frontend.
- [ ] **Docker Compose**: Orchestrate services (Backend, Frontend, DB) with `docker-compose.yml`.
- [ ] **Testing**: Write unit and integration tests.
- [ ] **Documentation**: Write comprehensive `README.md` and deployment guide.
