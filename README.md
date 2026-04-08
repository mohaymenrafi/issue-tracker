# Issue Tracker

A fullstack issue tracking app built with FastAPI and React, created for learning purposes.

## Stack

**Backend (`be-ist`)**
- Python + FastAPI
- JSON file-based storage
- Pydantic for schema validation

**Frontend (`fe-ist`)**
- React 19 + TypeScript
- Vite
- TailwindCSS v4
- TanStack Router
- shadcn/ui + Base UI

## Project Structure

```
issue-tracker/
├── be-ist/          # FastAPI backend
│   ├── app/
│   │   ├── middleware/
│   │   ├── routes/
│   │   ├── schemas.py
│   │   └── storage.py
│   └── main.py
└── fe-ist/          # React frontend
    ├── src/
    └── ...
```

## Getting Started

### Backend

```bash
cd be-ist
python -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
python main.py
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
