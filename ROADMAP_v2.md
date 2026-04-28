# Relay — Backend Roadmap v2

**Stack:** FastAPI + PostgreSQL + SQLModel + Alembic + WebSockets + Resend  
**Goal:** Production-grade portfolio backend — not just functional, but architected correctly  
**Updated:** April 28, 2026

---

## What's Done (Verified by Codebase Scan)

| Area | Status | Notes |
|------|--------|-------|
| FastAPI app setup, CORS, middleware | ✅ | |
| Pydantic settings via .env | ✅ | |
| SQLModel + PostgreSQL + Alembic | ✅ | 2 migrations |
| User model (id, email, username, hashed_pass, name) | ✅ | |
| Project model (id, name, description, owner_id) | ✅ | |
| Issue model (title, description, priority, status, reporter_id, assignee_id, project_id) | ✅ | |
| POST /auth/register | ✅ | |
| POST /auth/login (JWT) | ✅ | |
| get_current_user dependency | ✅ | |
| Full CRUD — Projects (with owner-only checks) | ✅ | |
| Full CRUD — Issues | ✅ | auth checks on edit/delete missing |
| Tests — auth, projects, issues | ✅ | good coverage |
| Global exception handlers | ✅ | |

---

## What's Broken / Incomplete (Fix Before Building Anything New)

| Issue | Impact |
|-------|--------|
| Issue edit/delete has no auth checks — any user can modify any issue | High |
| Pagination not applied correctly in queries | High |
| Status/priority filters accepted but not applied to query | High |
| No `GET /projects/:id/issues` endpoint | High |
| `get_optional_user` dependency missing (anonymous issue creation broken) | High |
| No `GET /users/me` or `PATCH /users/me` endpoints | Medium |
| No default ordering on issue list | Low |

---

## Phase 1 — Fix Bugs + Gaps

- [ ] Fix pagination — properly apply `.offset().limit()` in issues + projects queries
- [ ] Fix issue filters — apply status/priority correctly to query
- [ ] Add issue sorting — `GET /issues?sort_by=priority&order=desc` (sort by priority, created_at, updated_at)
- [ ] Add `get_optional_user` dependency (auto_error=False on OAuth2 scheme)
- [ ] Add issue authorization — check reporter / assignee / project member before edit/delete
- [ ] Add `GET /projects/:id/issues` — issues scoped to a project
- [ ] Add `GET /issues?project_id=null` — workspace inbox (issues with no project)
- [ ] Add `GET /users/me` — return current user profile
- [ ] Add `PATCH /users/me` — update name, username
- [ ] Add `GET /users/search?q=` — typeahead search by username or email (needed for member invite UI)
- [ ] Add soft deletes to Issue and Project — `deleted_at: datetime | None` column; filter out in all list queries; preserves ActivityLog integrity when records are "deleted"
- [ ] Write tests for all of the above

**Migration needed:** yes — add `deleted_at` to `issue` and `project` tables

---

## Phase 2 — Auth Completion

All the standard auth flows a real product ships with.

### Password security on register
- Minimum 8 characters
- At least one uppercase, one number
- Implemented as a Pydantic `field_validator` — no extra library

### Change password (logged in)
```
PATCH /auth/password
body: { current_password, new_password }
```
- Verify current password first → hash new → save

### Forgot password
```
POST /auth/forgot-password
body: { email }
→ generate reset token (random hex, store hashed with expiry)
→ send reset link via email (Resend)
```

```python
class PasswordResetToken(SQLModel, table=True):
    id: int
    user_id: int       # FK → user.id
    token_hash: str    # store hashed, never plaintext
    expires_at: datetime
    used: bool         # one-time use only
```

### Reset password
```
POST /auth/reset-password
body: { token, new_password }
→ validate token (exists, not expired, not used)
→ set new password → mark token as used
```

### Refresh Tokens
Current JWT expires in 30 minutes — users get silently logged out mid-session. Fix with a proper refresh token flow.

```python
class RefreshToken(SQLModel, table=True):
    id: int
    user_id: int       # FK → user.id
    token_hash: str    # store hashed, never plaintext
    expires_at: datetime   # long-lived — 30 days
    revoked: bool      # logout invalidates it immediately
```

```
POST /auth/refresh
body: { refresh_token }
→ validate token (exists, not expired, not revoked)
→ return new access_token (15 min) + new refresh_token (30 days, rotate on use)
```

- Access token: short-lived (15 min) — used on every API request
- Refresh token: long-lived (30 days), stored hashed in DB — used only to get new access tokens
- On logout: revoke the refresh token so it can't be reused

- [ ] Password strength validator on register (Pydantic field_validator)
- [ ] PATCH /auth/password (change password when logged in)
- [ ] PasswordResetToken model + migration
- [ ] POST /auth/forgot-password (generate token, send email)
- [ ] POST /auth/reset-password (consume token, set new password)
- [ ] Expire reset tokens after 1 hour
- [ ] RefreshToken model + migration
- [ ] Update POST /auth/login to return both access_token + refresh_token
- [ ] POST /auth/refresh (rotate refresh token, return new access token)
- [ ] POST /auth/logout (revoke refresh token)
- [ ] Tests for all auth routes

---

## Phase 3 — Project Members + Roles

The permission backbone everything else hangs off.

### New model: `ProjectMember`
```python
class ProjectMember(SQLModel, table=True):
    project_id: int   # FK → project.id, primary_key=True
    user_id: int      # FK → user.id, primary_key=True
    role: str         # "owner" | "member" | "viewer"
    joined_at: datetime
```

Composite PK `(project_id, user_id)` — one row per user per project.  
Same user can be in multiple projects, each with their own role.

### Endpoints
| Method | Route | Who |
|--------|-------|-----|
| GET | `/projects/:id/members` | any member |
| POST | `/projects/:id/members` | owner only — body: `{ email or username }` |
| PATCH | `/projects/:id/members/:user_id` | owner only — body: `{ role }` |
| DELETE | `/projects/:id/members/:user_id` | owner, or self-leave |

### Permissions matrix
| Action | Owner | Member | Viewer |
|--------|-------|--------|--------|
| View project + issues | ✅ | ✅ | ✅ |
| Edit / delete project | ✅ | ❌ | ❌ |
| Create issue in project | ✅ | ✅ | ❌ |
| Edit / delete own issue | ✅ | ✅ | ❌ |
| Edit / delete any issue | ✅ | ❌ | ❌ |
| Add / remove members | ✅ | ❌ | ❌ |
| Change member roles | ✅ | ❌ | ❌ |
| Leave project | ❌* | ✅ | ✅ |

*Owner cannot leave — must transfer ownership or delete the project first.

### Key dependency
```python
def require_project_role(min_role: str):
    # reusable dependency — plug into any route that needs role checks
```

- [ ] ProjectMember model + migration
- [ ] Auto-add project creator as owner on POST /projects
- [ ] GET /projects/:id/members
- [ ] POST /projects/:id/members (lookup by email or username)
- [ ] PATCH /projects/:id/members/:user_id
- [ ] DELETE /projects/:id/members/:user_id
- [ ] `require_project_role()` dependency
- [ ] Wire role checks into issue edit/delete within a project
- [ ] Tests for all member routes + role enforcement

---

## Phase 4 — Depth Features

### 4a. Comments

```python
class Comment(SQLModel, table=True):
    id: int
    issue_id: int        # FK → issue.id
    user_id: int | None  # FK → user.id — None = anonymous
    body: str            # 1–2000 chars
    created_at: datetime
```

| Method | Route | Auth |
|--------|-------|------|
| GET | `/issues/:id/comments` | No |
| POST | `/issues/:id/comments` | Optional (anonymous allowed) |
| PATCH | `/issues/:id/comments/:comment_id` | Author only |
| DELETE | `/issues/:id/comments/:comment_id` | Author or project owner |

- [ ] Comment model + migration
- [ ] All 4 comment routes
- [ ] Tests

---

### 4b. Activity Log

Every meaningful action is recorded. This is what makes the app feel production-grade.

```python
class ActivityLog(SQLModel, table=True):
    id: int
    user_id: int | None      # FK → user.id — None = anonymous
    project_id: int | None   # FK → project.id
    issue_id: int | None     # FK → issue.id
    action: str              # see vocabulary below
    metadata: dict           # JSON — context for the action
    created_at: datetime
```

**Action vocabulary:**
```
issue_created         issue_updated        issue_deleted
issue_status_changed  issue_assigned       issue_unassigned
comment_added         comment_deleted
member_added          member_removed       member_role_changed
project_created       project_updated      project_deleted
```

**metadata examples:**
```json
{ "from": "open", "to": "in_progress" }
{ "added_user_id": 5, "role": "member" }
```

| Method | Route | Auth |
|--------|-------|------|
| GET | `/projects/:id/activity` | any member |
| GET | `/issues/:id/activity` | any viewer |

- Written inside route handlers after the main action succeeds — never blocks the response

- [ ] ActivityLog model + migration
- [ ] Write activity inside every relevant route (issues, comments, members, project)
- [ ] GET /projects/:id/activity (paginated, newest first)
- [ ] GET /issues/:id/activity
- [ ] Tests

---

### 4c. Notifications (In-App)

```python
class Notification(SQLModel, table=True):
    id: int
    user_id: int     # FK → user.id — who receives it
    type: str        # "assigned" | "commented" | "member_added"
    message: str     # "Rafi assigned you to Bug #42"
    link: str        # "/projects/1/issues/42"
    is_read: bool    # default False
    created_at: datetime
```

**Triggered when:**
- Issue assigned to you → `assigned`
- Someone comments on your issue → `commented`
- You're added to a project → `member_added`

| Method | Route | Auth |
|--------|-------|------|
| GET | `/notifications` | Yes — your own only |
| PATCH | `/notifications/:id/read` | Yes |
| PATCH | `/notifications/read-all` | Yes |
| DELETE | `/notifications/:id` | Yes |

- [ ] Notification model + migration
- [ ] Write notifications inside relevant routes (assign, comment, member add)
- [ ] All 4 notification routes
- [ ] Tests

---

### 4d. Issue Labels (do last)

```python
class Label(SQLModel, table=True):
    id: int
    name: str      # custom per project — "bug", "feature", "chore"
    color: str     # hex — "#ef4444"
    project_id: int  # FK → project.id

class IssueLabel(SQLModel, table=True):
    issue_id: int  # PK
    label_id: int  # PK
```

| Method | Route | Auth |
|--------|-------|------|
| GET | `/projects/:id/labels` | any member |
| POST | `/projects/:id/labels` | member+ |
| DELETE | `/projects/:id/labels/:label_id` | owner only |
| POST | `/issues/:id/labels` | member+ |
| DELETE | `/issues/:id/labels/:label_id` | member+ |

- [ ] Label + IssueLabel models + migration
- [ ] Label CRUD routes
- [ ] Attach/detach label to/from issue
- [ ] Tests

---

## Phase 5 — Real-Time (WebSockets)

Issue updates and new comments appear instantly for all users in the same project.

### How it works
```
Client connects → WS /ws/projects/:id
Server tracks: project_id → [active connections]

Any update in that project → server broadcasts to all connections in that room
```

### ConnectionManager
```python
class ConnectionManager:
    def __init__(self):
        self.rooms: dict[int, list[WebSocket]] = {}

    async def connect(self, project_id: int, ws: WebSocket): ...
    async def disconnect(self, project_id: int, ws: WebSocket): ...
    async def broadcast(self, project_id: int, message: dict): ...

manager = ConnectionManager()  # singleton in app state
```

### WebSocket route
```python
@router.websocket("/ws/projects/{project_id}")
async def project_ws(project_id: int, ws: WebSocket):
    await manager.connect(project_id, ws)
    try:
        while True:
            await ws.receive_text()  # keep connection alive
    except WebSocketDisconnect:
        await manager.disconnect(project_id, ws)
```

### Broadcast inside routes
```python
# after issue update:
await manager.broadcast(project_id, {
    "type": "issue_updated",
    "issue_id": issue.id,
    "changes": { "status": "in_progress" }
})
```

**Events to broadcast:**
- `issue_created` / `issue_updated` / `issue_deleted`
- `comment_added`
- `member_added` / `member_removed`
- `notification` (per-user connection, not per-room)

- [ ] ConnectionManager class
- [ ] WS route `/ws/projects/:id`
- [ ] Broadcast inside issue routes (create, update, delete)
- [ ] Broadcast inside comment create route
- [ ] Broadcast inside member add/remove routes
- [ ] Per-user WS for notifications: `/ws/notifications`

---

## Phase 6 — Email via Resend

```
pip install resend
```

Free tier: 3,000 emails/month, 100/day. Best DX for developers.

**When to send:**
- Assigned to an issue
- Someone comments on your issue
- Added to a project
- Password reset requested

### Pattern — always use BackgroundTasks, never block the response
```python
@router.patch("/{issue_id}")
async def update_issue(..., background_tasks: BackgroundTasks):
    # update issue...
    if assignee changed:
        background_tasks.add_task(send_assignment_email, to=..., ...)
    return issue
```

- [ ] Add `resend_api_key` to Settings
- [ ] Email utility functions (assignment, comment, member_added, password_reset)
- [ ] Wire into relevant routes via BackgroundTasks
- [ ] Tests (mock Resend calls)

---

## Phase 7 — Betterment

These make the project look serious, not just functional.

### Rate Limiting
```
pip install slowapi
```
- POST /auth/login → 5 req/min per IP
- POST /auth/forgot-password → 3 req/min per IP
- General API → 100 req/min per user
- `/ai/*` routes → 10 req/min per user (Claude calls cost money — protect the quota)

### Structured Logging
- JSON-formatted logs (parseable by Railway, Datadog, etc.)
- Log every request: method, path, status, duration (extend existing timer middleware)
- Log errors with stack traces

### Health Check
```
GET /health → { "status": "ok", "db": "ok", "timestamp": "..." }
```
Required by Railway, Vercel, and every load balancer.

### Caching (Redis)
```
pip install redis fastapi-cache2
```
- Cache `GET /projects` + `GET /issues` (30s TTL)
- Invalidate on write
- Use Upstash (free Redis tier)

### DB Indexes
Add indexes on frequently queried FK columns:
- `issue.project_id`, `issue.reporter_id`, `issue.assignee_id`
- `projectmember.user_id`
- `activitylog.project_id`, `activitylog.issue_id`

### Load Testing
```
pip install locust
```
Simulate: login → create project → create issues → fetch issues  
Identify slow queries → add indexes → retest.

- [ ] Rate limiting via slowapi (auth routes + general API + AI routes)
- [ ] Structured JSON logging
- [ ] GET /health endpoint
- [ ] Redis caching on list endpoints (Upstash free tier)
- [ ] DB indexes migration
- [ ] Locust load test script
- [ ] BackgroundTasks applied consistently (email, activity log writes)

---

## Phase 8 — Deployment + Documentation

Do this last — when the app is feature-complete and tested.

### Docker

```
backend/Dockerfile       ← FastAPI app
frontend/Dockerfile      ← React/Vite build + serve
docker-compose.yml       ← postgres + backend + frontend + redis
.env.example             ← template with all required keys, no real values
```

**`docker-compose.yml` services:**
```yaml
services:
  db:
    image: postgres:16
    environment: { POSTGRES_DB, POSTGRES_USER, POSTGRES_PASSWORD }
    volumes: [ postgres_data:/var/lib/postgresql/data ]

  redis:
    image: redis:7-alpine

  api:
    build: ./backend
    depends_on: [ db, redis ]
    env_file: .env
    deploy:
      replicas: 2   # Coolify/Traefik load-balances across these

  web:
    build: ./frontend
    depends_on: [ api ]
```

**Coolify setup on Hetzner:**
- Point Coolify at the repo → it reads `docker-compose.yml`
- Coolify's Traefik handles reverse proxy + SSL (Let's Encrypt) automatically
- Set all env vars in Coolify UI (never commit real `.env`)

### README

A good README is the first thing a recruiter or hiring manager reads. Make it count.

**Structure:**
```
# Relay

1-2 sentence description of what it is and why it exists.

## Live Demo
Link to deployed app + Swagger docs (/docs)

## Tech Stack
Table: Backend / Frontend / AI / Infra

## Architecture Highlights
3-4 bullet points on non-obvious decisions:
- Role-based access via ProjectMember join table
- WebSocket rooms keyed by project_id for real-time updates
- AI as translation layer only — Claude extracts filters, existing query runs unchanged
- Refresh token rotation with DB-stored hashed tokens

## Local Development
Step-by-step: clone → cp .env.example .env → docker compose up

## API Docs
FastAPI auto-generates Swagger at /docs — link it
```

- [ ] `backend/Dockerfile`
- [ ] `frontend/Dockerfile`
- [ ] `docker-compose.yml` with postgres + redis + api (2 replicas) + web
- [ ] `.env.example` with all required keys
- [ ] Deploy to Hetzner via Coolify
- [ ] Verify live URL end-to-end (auth → create project → create issue → real-time update)
- [ ] Write README (demo link, stack, architecture highlights, local setup)

---

## Build Order Summary

```
Phase 1  →  Fix bugs + gaps (pagination, filters, issue auth, sorting, /me, user search, soft deletes)
Phase 2  →  Auth completion (password security, change/forgot/reset, refresh tokens)
Phase 3  →  ProjectMember + roles (the permission backbone)
Phase 4a →  Comments
Phase 4b →  Activity Log
Phase 4c →  Notifications (in-app)
Phase 4d →  Labels
Phase 5  →  WebSockets (real-time)
Phase 6  →  Email via Resend
Phase 7  →  Betterment (rate limiting, logging, caching, load testing)
Phase 8  →  Deployment + README (Docker, Coolify, Hetzner)
```

---

## Final Schema

```
User
 ├── email, username, hashed_pass, name
 ├─< ProjectMember >─ Project
 ├─< Issue (as reporter)
 ├─< Issue (as assignee)
 ├─< Comment
 ├─< Notification
 ├─< ActivityLog
 └─< PasswordResetToken

Project
 ├── owner_id → User
 ├─< ProjectMember
 ├─< Issue
 ├─< Label
 └─< ActivityLog

Issue
 ├── project_id → Project (nullable)
 ├── reporter_id → User (nullable)
 ├── assignee_id → User (nullable)
 ├─< Comment
 ├─< IssueLabel >─ Label
 └─< ActivityLog

ProjectMember
 ├── project_id → Project
 ├── user_id → User
 └── role: owner | member | viewer

Comment
 ├── issue_id → Issue
 └── user_id → User (nullable = anonymous)

Notification
 ├── user_id → User
 └── type, message, link, is_read

ActivityLog
 ├── user_id → User (nullable)
 ├── project_id → Project (nullable)
 ├── issue_id → Issue (nullable)
 └── action, metadata (JSON)

Label
 └── project_id → Project

IssueLabel
 ├── issue_id → Issue
 └── label_id → Label

PasswordResetToken
 ├── user_id → User
 └── token_hash, expires_at, used

RefreshToken
 ├── user_id → User
 └── token_hash, expires_at, revoked

Issue         ← soft delete
 └── deleted_at: datetime | None

Project       ← soft delete
 └── deleted_at: datetime | None
```
