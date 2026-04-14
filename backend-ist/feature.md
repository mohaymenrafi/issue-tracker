# FastAPI Learning Roadmap — Issue Tracker

Learning by doing. Each feature below is something you can add to this project.
They're ordered from foundational to advanced — complete them in order.

---

## What You've Already Built

- [x] FastAPI app setup with `uvicorn`
- [x] CORS middleware
- [x] Custom middleware (timer via `X-Response-Time` header)
- [x] `APIRouter` with prefix and tags
- [x] Pydantic schemas — `BaseModel`, `Field`, `Enum`
- [x] Full CRUD — `GET`, `POST`, `PATCH`, `DELETE`
- [x] `HTTPException` with proper status codes
- [x] `response_model` to control API output shape
- [x] JSON file-based storage

---

## Next Steps

### 1. Query Parameters & Filtering
**Goal:** Let the frontend filter issues by status or priority via URL params.

Add `?status=open` or `?priority=high` support to `GET /api/v1/issues/`.

```python
@router.get("/")
def get_issues(status: Optional[IssueStatus] = None, priority: Optional[IssuePriority] = None):
    ...
```

**Concepts:** query params, optional params, basic filtering logic.

---

### 2. Pagination
**Goal:** Return issues in pages instead of all at once.

Add `?page=1&limit=10` to the list endpoint. Return total count alongside items.

**Concepts:** query params with defaults, slicing lists, response envelope pattern.

---

### 3. Environment Variables & Settings
**Goal:** Stop hardcoding things like the data file path or CORS origins.

Use `pydantic-settings` to load config from a `.env` file.

```python
from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    data_file: str = "data/issues.json"
    allowed_origins: list[str] = ["http://localhost:5173"]

    class Config:
        env_file = ".env"
```

**Concepts:** `pydantic-settings`, `.env` files, separating config from code.

---

### 4. Dependency Injection
**Goal:** Understand FastAPI's `Depends()` — one of its most important features.

Refactor your routes to use a dependency that loads issues from storage, instead of calling `load_data()` directly in every route.

```python
def get_issues_db() -> list:
    return load_data()

@router.get("/")
def list_issues(issues: list = Depends(get_issues_db)):
    ...
```

**Concepts:** `Depends()`, reusable dependencies, separation of concerns.

---

### 5. Real Database with SQLModel
**Goal:** Replace the JSON file with a real SQLite database (easy upgrade to PostgreSQL later).

Use `SQLModel` (made by the FastAPI author — combines SQLAlchemy + Pydantic).

- Define a `Issue` table model
- Create a DB session dependency
- Rewrite your CRUD routes using DB sessions

**Concepts:** ORM basics, sessions, migrations (Alembic), SQLite → PostgreSQL path.

---

### 6. Global Exception Handlers
**Goal:** Return consistent error responses instead of letting unhandled errors crash the app.

```python
@app.exception_handler(Exception)
async def generic_exception_handler(request, exc):
    return JSONResponse(status_code=500, content={"detail": "Internal server error"})
```

**Concepts:** `exception_handler`, `RequestValidationError`, custom error shapes.

---

### 7. Testing with `pytest`
**Goal:** Write tests for your routes using FastAPI's built-in test client.

```python
from fastapi.testclient import TestClient
from main import app

client = TestClient(app)

def test_get_issues():
    response = client.get("/api/v1/issues/")
    assert response.status_code == 200
```

**Concepts:** `TestClient`, test fixtures, mocking dependencies, `pytest`.

---

### 8. Authentication with JWT
**Goal:** Protect your routes so only logged-in users can create/update/delete issues.

- Add `POST /auth/register` and `POST /auth/login` routes
- Return a JWT token on login
- Use a `get_current_user` dependency on protected routes

**Concepts:** JWT, `python-jose`, `passlib`, OAuth2 password flow, protected routes.

---

### 9. Background Tasks
**Goal:** Run work after returning a response (e.g., send a notification when an issue is created).

```python
from fastapi import BackgroundTasks

def notify(issue_id: str):
    print(f"Issue {issue_id} was created")  # replace with email/webhook later

@router.post("/")
def create_issue(payload: IssueCreate, background_tasks: BackgroundTasks):
    ...
    background_tasks.add_task(notify, new_issue["id"])
    return new_issue
```

**Concepts:** `BackgroundTasks`, async side effects, task queues (Celery/ARQ later).

---

### 10. Async Routes
**Goal:** Understand when and why to use `async def` instead of `def` in routes.

Convert your route functions to `async def` and your storage functions to use `aiofiles` for non-blocking file I/O.

**Concepts:** async/await, blocking vs non-blocking I/O, when async actually helps.

---

### 11. Lifespan Events
**Goal:** Run setup/teardown logic when the app starts and stops (e.g., connect to DB on startup).

Replace the old `@app.on_event("startup")` pattern with the modern `lifespan` approach:

```python
from contextlib import asynccontextmanager

@asynccontextmanager
async def lifespan(app: FastAPI):
    # startup: connect to DB, load config, etc.
    yield
    # shutdown: close connections

app = FastAPI(lifespan=lifespan)
```

**Concepts:** lifespan context manager, resource management, startup/shutdown hooks.

---

## Bonus (After the Above)

- **Rate limiting** — prevent abuse using `slowapi`
- **File uploads** — let users attach screenshots to issues
- **WebSockets** — push live issue updates to the frontend without polling
- **Docker** — containerize the app for consistent deployments
- **CI/CD** — auto-run tests on push with GitHub Actions
