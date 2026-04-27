# Relay

A fullstack issue tracking app built with FastAPI and React, created for learning purposes.

## Stack

**Backend (`backend`)**
- Python + FastAPI
- SQLModel + SQLAlchemy (database URL from environment)
- Alembic for migrations
- Pydantic Settings for configuration

**Frontend (`fe-ist`)**
- React 19 + TypeScript
- Vite
- TailwindCSS v4
- TanStack Router
- shadcn/ui + Base UI

## Project Structure

```
relay/
├── backend/                    # FastAPI backend
│   ├── alembic/                # DB migrations (env, versions, …)
│   ├── app/
│   │   ├── models/             # SQLModel models (e.g. issues)
│   │   ├── routes/             # API routers (e.g. issues)
│   │   ├── config.py           # Settings (env, CORS, database URL)
│   │   ├── database.py         # Engine + session dependency
│   │   └── main.py             # FastAPI app, CORS, exception handlers
│   ├── tests/                  # pytest (API tests, fixtures)
│   ├── alembic.ini
│   ├── pyproject.toml
│   └── uv.lock
└── fe-ist/                     # React frontend
    ├── src/
    │   ├── components/
    │   ├── lib/
    │   ├── App.tsx
    │   └── main.tsx
    └── ...
```

## Getting Started

### Backend

Python dependencies are installed with **[uv](https://docs.astral.sh/uv/)** (not `pip`). Install [uv](https://docs.astral.sh/uv/getting-started/installation/) if you do not have it, then:

```bash
cd backend
uv sync
# Set DATABASE_URL in `.env` (see `app/config.py`), then apply migrations and run:
uv run alembic upgrade head
uv run uvicorn app.main:app --reload --port 8000
```

API runs at `http://localhost:8000`
Interactive docs at `http://localhost:8000/docs`

### Frontend

```bash
cd fe-ist
pnpm install
pnpm dev
```

App runs at `http://localhost:3000`

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/v1/issues` | List all issues |
| `POST` | `/api/v1/issues` | Create an issue |
| `GET` | `/api/v1/issues/:id` | Get an issue |
| `PATCH` | `/api/v1/issues/:id` | Update an issue |
| `DELETE` | `/api/v1/issues/:id` | Delete an issue |

### Issue Schema

| Field | Type | Values |
|-------|------|--------|
| `title` | string | 3–100 chars |
| `description` | string | 5–1000 chars |
| `priority` | enum | `low`, `medium`, `high` |
| `status` | enum | `open`, `in_progress`, `closed` |
