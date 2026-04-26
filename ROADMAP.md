# Issue Tracker — Full Stack Roadmap

**Stack:** FastAPI + PostgreSQL + React 19 + TanStack Router/Query + Tailwind v4  
**Goal:** Portfolio-ready fullstack app inspired by Linear — core loop: Issues + Projects + AI queries  
**Today:** April 21, 2026

> Assumes ~2–3 hrs of focused work per day.  
> Buffer days are real — use them. Learning takes longer than coding.

---

## Vision

A Linear-inspired issue tracker where:
- Issues can exist **independently** (workspace-level) or **inside a project**
- Issues can be created by **authenticated users or anonymously**
- Issues can be **assigned** to any user, on create or later
- Users can query issues with **natural language** ("show me all open issues this week")

---

## Data Model

```
User
 ├─< ProjectMember >─ Project
 └─< Issue (as reporter or assignee)

Issue
 ├── project_id    → Project | NULL   (NULL = workspace-level / not in a project)
 ├── reporter_id   → User   | NULL   (NULL = anonymous submission)
 └── assignee_id   → User   | NULL   (optional, set on create or updated later)
```

**Rules:**
- Any user (or anonymous) can create an issue
- `reporter_id` is auto-set from the token if one is provided (optional auth)
- `assignee_id` is optional — passed in body, can be updated anytime
- `project_id` is optional — issues without one appear in the workspace inbox
- Project CRUD and member management require authentication
- Deleting/editing an issue requires being the reporter, an assignee, or a project member with the right role

---

## What's Already Done

**Backend**
- [x] FastAPI app, uvicorn, CORS, timer middleware
- [x] APIRouter, Pydantic schemas, Enums
- [x] Full CRUD for issues (GET, POST, PATCH, DELETE)
- [x] HTTPException + response_model
- [x] Query params — filter by status/priority
- [x] Pagination (page + limit)
- [x] Env vars via pydantic-settings
- [x] Dependency injection with Depends()
- [x] SQLModel + PostgreSQL + Alembic
- [x] Global exception handlers
- [x] Lifespan events
- [x] User model (id, email, username, hashed_pass, name, created_at)
- [x] POST /auth/register — hash password, return user
- [x] POST /auth/login — verify password, return JWT
- [x] `get_current_user` dependency — decode JWT, load user
- [x] POST, PATCH, DELETE /issues — require auth
- [x] Tests for issues and auth routes

**Frontend**
- [x] React 19 + Vite + TanStack Router + TanStack Query
- [x] Tailwind v4 + shadcn/ui setup
- [x] Issue list, issue form, confirm dialog
- [x] API layer + types

---

## What Needs to Be Fixed Before Moving Forward

### Issue model — missing FK fields
The current `Issue` table has no connection to users or projects.

**Changes needed (`app/models/issues.py`):**
```python
project_id: int | None = Field(default=None, foreign_key="project.id")
reporter_id: int | None = Field(default=None, foreign_key="user.id")
assignee_id: int | None = Field(default=None, foreign_key="user.id")
```
New Alembic migration required.

### Issue creation — reporter not stored
`POST /issues` currently requires auth but never saves `current_user.id` as `reporter_id`.  
Also needs to accept an optional `assignee_id` in the request body.

### Optional auth dependency missing
For anonymous issue creation, a `get_optional_user` dependency is needed:
```python
# Returns User if token present and valid, else None — never raises
def get_optional_user(...)
```

---

## Week 1 — Apr 13–19: Backend Auth + Projects ✅

### Day 1 — Apr 13 · Testing with pytest ✅
### Day 2 — Apr 14 · JWT Auth — Models + Register/Login ✅
### Day 3 — Apr 15 · JWT Auth — Protected Routes ✅
### Day 4–5 — Apr 16–17 · Projects + Issue model update
> **Status: Not started — do this before any frontend work**

**Issue model update:**
- Add `project_id` (nullable FK → Project)
- Add `reporter_id` (nullable FK → User) — auto-set from token on create
- Add `assignee_id` (nullable FK → User) — optional, from request body
- Add `get_optional_user` dependency for anonymous-friendly routes
- Update `POST /issues` to store `reporter_id`, accept `assignee_id`
- Alembic migration

**Project model:**
- `Project` table: id, name, description, owner_id → User, created_at
- Full CRUD: GET /projects, POST /projects, PATCH /projects/:id, DELETE /projects/:id
- `GET /projects/:id/issues` — issues scoped to a project
- `GET /issues` stays as workspace-level (no project_id, or project_id=null)

**Concepts learned:** nullable FKs, optional auth, relationship queries

### Day 5 — Apr 17 · Project Members + Roles
- `ProjectMember` join table: project_id, user_id, role (owner | member | viewer)
- Auto-add creator as owner on project create
- `POST /projects/:id/members` — invite a user by email or username
- `DELETE /projects/:id/members/:user_id` — remove a member
- Issue edit/delete inside a project checks membership + role
- Anonymous users can still create workspace-level issues (no project gate)

**Concepts learned:** many-to-many, role-based access, dependency reuse

### Day 6–7 — Apr 18–19 · Buffer + Review
- Clean up routes, verify Alembic migrations are in order
- Test all routes manually via Swagger UI (/docs)

---

## Week 2 — Apr 20–26: Frontend Auth + Projects + Issues

### Day 1 — Apr 20 · FE Auth — Login + Register Pages
> **Status: Not started (today is Apr 21 — start here)**

- Login page + Register page (TanStack Router routes)
- POST to /auth/login, store JWT in localStorage
- Axios/fetch interceptor to attach Bearer token to all requests
- Redirect to dashboard on success

### Day 2 — Apr 21 · FE Auth — Protected Routes + User State
- Auth context or Zustand store for current user
- TanStack Router `beforeLoad` guard — redirect to /login if no token
- Logout button — clear token, redirect
- Show current user in the header
- Anonymous users land on the issue inbox, can browse and create without logging in

### Day 3 — Apr 22 · FE Projects — List + Create
- `/projects` — list your projects as cards
- Create project modal/form
- Click project → go to `/projects/:id/issues`
- Workspace inbox `/issues` — shows all issues not tied to a project

### Day 4 — Apr 23 · FE Issues — List + Detail
- Issue list with filter tabs (All / Open / In Progress / Closed)
- Filter by assignee, priority
- Issue detail modal or side panel (click → full details including reporter + assignee)
- Create issue form: optional project, optional assignee (searchable user dropdown)
- Connect existing IssueForm to the new fields

### Day 5 — Apr 24 · FE Kanban Board
- Board view: 3 columns — Open | In Progress | Closed
- Toggle between list view and board view
- Drag-to-move: use `@dnd-kit/core`
- On drop: PATCH /issues/:id with new status

> This is the thing that makes your portfolio screenshot memorable.

### Day 6–7 — Apr 25–26 · Buffer + Polish Pass
- Loading skeletons on lists
- Empty states ("No issues yet — create one")
- Error toasts on failed API calls
- Mobile-responsive check

---

## Week 3 — Apr 27–30: AI + Stretch + Deploy

### Apr 27 · AI Query Endpoint (BE)
Natural language → structured filters, powered by Claude API.

**How it works:**
```
POST /api/v1/ai/query
body: { "prompt": "show me all open issues assigned to me this week" }

→ Claude (haiku) extracts: { status: "open", assignee_id: <me>, created_after: "2026-04-21" }
→ your existing issues query runs with those filters
→ returns matching issues
```

**Why this approach:**
- AI is a translation layer only — your existing filter/pagination logic is untouched
- Use claude-haiku-4-5 (fast, cheap, good at structured extraction)
- Return both the issues AND the parsed filters so the FE can show "interpreted as: open + this week"

**Example prompts it handles:**
- "show me all issues for this week"
- "what's open and high priority"
- "anything assigned to me that's not closed"
- "issues created by rafi last month"

**Install:** `anthropic` Python SDK

### Apr 28 · AI Query UI (FE)
- Search/command bar at the top of the issues list
- User types a prompt → hits Enter → calls POST /ai/query
- Shows results in the issue list
- Shows a pill like "Filtered: open · this week · assigned to me" so users understand what was matched
- Fallback: if AI returns no filters, show all issues

### Apr 29 · Comments (Stretch)
- `Comment` table: id, issue_id, user_id (nullable), body, created_at
- `GET /issues/:id/comments` + `POST /issues/:id/comments`
- FE: comment thread at bottom of issue detail
- Anonymous comments allowed (user_id = null)

### Apr 29 · Deploy
- **Backend:** Railway (free tier, supports PostgreSQL + FastAPI)
- **Frontend:** Vercel (free, connect the repo)
- Set real env vars: DATABASE_URL, SECRET_KEY, ANTHROPIC_API_KEY, CORS origins
- Test the live URL end-to-end

### Apr 30 · Portfolio Writeup
- README: what it is, tech stack, how to run locally, live demo link
- Screenshot of the Kanban board + AI query in action
- Add to portfolio / LinkedIn

---

## Priority Order (If You Run Out of Time)

1. **Fix Issue model** — add project_id, reporter_id, assignee_id, migration (prerequisite for everything)
2. **JWT Auth FE** — login, register, protected routes
3. **Projects CRUD** — gives the app structure
4. **Kanban board** — the visual centrepiece
5. **AI query** — the differentiator
6. **Deploy** — a live URL is worth 10x local screenshots
7. **Comments** — nice, skippable

---

## Common Pitfalls

- **Alembic nullable FK migrations** — `alembic downgrade -1` and retry if it breaks
- **Two FKs to same table** (`reporter_id` + `assignee_id` both → User) — SQLAlchemy needs `foreign_keys=` in the relationship definition
- **Optional auth** — `OAuth2PasswordBearer(auto_error=False)` is the key flag; don't raise if token is missing
- **AI structured output** — ask Claude to return JSON only, validate it against a Pydantic model before using it as query params
- **JWT on FE** — CORS + Authorization header issues are common; check that your interceptor is attaching `Bearer <token>` correctly

---

## Quick Reference: Remaining Concepts to Learn

| Area | Concept |
|------|---------|
| BE — models | Nullable FKs, two FKs to same table, SQLAlchemy `foreign_keys=` |
| BE — auth | `get_optional_user`, OAuth2 `auto_error=False` |
| BE — projects | Nested routes, role-based access, many-to-many |
| BE — AI | Anthropic SDK, structured extraction, prompt design |
| FE — auth | Auth context / Zustand, route guards, token interceptor |
| FE — issues | Assignee picker, project scoping, optimistic updates |
| FE — kanban | dnd-kit setup, PATCH on drop |
| FE — AI | Command bar UX, displaying parsed filter pills |
