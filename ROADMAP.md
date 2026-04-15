# Issue Tracker — Full Stack Roadmap

**Stack:** FastAPI + PostgreSQL + React 19 + TanStack Router/Query + Tailwind v4  
**Goal:** Portfolio-ready fullstack app by end of April 2026  
**Today:** April 12, 2026 — 18 days remaining this month

> Assumes ~2–3 hrs of focused work per day.  
> Buffer days are real — use them. Learning takes longer than coding.

---

## What's Already Done

**Backend**
- [x] FastAPI app, uvicorn, CORS, timer middleware
- [x] APIRouter, Pydantic schemas, Enums
- [x] Full CRUD (GET, POST, PATCH, DELETE)
- [x] HTTPException + response_model
- [x] Query params — filter by status/priority
- [x] Pagination (page + limit)
- [x] Env vars via pydantic-settings
- [x] Dependency injection with Depends()
- [x] SQLModel + PostgreSQL + Alembic
- [x] Global exception handlers
- [x] Lifespan events

**Frontend**
- [x] React 19 + Vite + TanStack Router + TanStack Query
- [x] Tailwind v4 + shadcn/ui setup
- [x] Issue list, issue form, confirm dialog
- [x] API layer + types

---

## The Target (Minimum Impressive Portfolio)

```
Auth → Projects → Issues (with filters/kanban) → Deploy
```

This is the core loop. Everything else is a bonus.

---

## Week 1 — Apr 13–19: Backend Auth + Projects

### Day 1 — Apr 13 · Testing with pytest
**BE only**
- Install pytest + httpx + pytest-asyncio
- Write a conftest.py with a test DB session fixture
- Test: GET /issues, POST /issues, GET /issues/:id, 404 case, 422 validation error
- Goal: understand how TestClient + Depends() overrides work

**Concepts learned:** TestClient, dependency overrides, test fixtures

---

### Day 2 — Apr 14 · JWT Auth — Models + Register/Login
**BE only**
- Add `User` SQLModel table (id, email, hashed_password, created_at)
- Alembic migration
- `POST /auth/register` — hash password with passlib, return user
- `POST /auth/login` — verify password, return JWT access token
- Install: `python-jose`, `passlib[bcrypt]`

**Concepts learned:** password hashing, JWT structure, OAuth2 password flow

---

### Day 3 — Apr 15 · JWT Auth — Protected Routes
**BE only**
- `get_current_user` dependency — decode JWT, load user from DB
- Protect: POST, PATCH, DELETE /issues (require auth)
- GET /issues stays public
- Write tests for auth routes

**Concepts learned:** Depends() chaining, Bearer tokens, 401 vs 403

---

### Day 4 — Apr 16 · Projects Model
**BE only**
- Add `Project` table (id, name, description, owner_id → User)
- Add `project_id` FK to Issue table
- Alembic migration
- Full CRUD for projects: GET /projects, POST /projects, PATCH, DELETE
- Issues are now scoped: GET /projects/:id/issues

**Concepts learned:** foreign keys, nested routes, relationship queries

---

### Day 5 — Apr 17 · Project Members + Roles
**BE only**
- Add `ProjectMember` join table (project_id, user_id, role: owner/member/viewer)
- Auto-add creator as owner on project create
- `POST /projects/:id/members` — invite a user
- `DELETE /projects/:id/members/:user_id` — remove a member
- Gate issue create/edit/delete behind membership check

**Concepts learned:** many-to-many, role-based access, dependency reuse

---

### Day 6–7 — Apr 18–19 · Buffer + Review
- Catch up on anything from the week
- Review all your routes, clean up anything messy
- Make sure Alembic migrations are in order
- Test everything manually via Swagger UI (/docs)

---

## Week 2 — Apr 20–26: Frontend Auth + Projects + Issues

### Day 1 — Apr 20 · FE Auth — Login + Register Pages
**FE only**
- Login page + Register page (TanStack Router routes)
- POST to /auth/login, store JWT in localStorage
- Axios/fetch interceptor to attach Bearer token to all requests
- Redirect to dashboard on success

---

### Day 2 — Apr 21 · FE Auth — Protected Routes + User State
**FE only**
- Auth context or Zustand store for current user
- TanStack Router `beforeLoad` guard — redirect to /login if no token
- Logout button — clear token, redirect
- Show current user's name in the header

---

### Day 3 — Apr 22 · FE Projects — List + Create
**FE only**
- `/projects` — list your projects as cards
- Create project modal/form
- Click project → go to `/projects/:id/issues`
- This becomes your app's home screen

---

### Day 4 — Apr 23 · FE Issues — List + Detail
**FE only**
- `/projects/:id/issues` — issue list with filter tabs (All / Open / In Progress / Closed)
- Issue detail modal or side panel (click issue → see full details)
- Connect existing IssueForm to project context (create issue inside a project)

---

### Day 5 — Apr 24 · FE Kanban Board
**FE only**
- Board view: 3 columns — Open | In Progress | Closed
- Toggle between list view and board view
- Drag-to-move: use `@dnd-kit/core` (lightweight, works well with React 19)
- On drop: PATCH /issues/:id with new status

> This is the thing that makes your portfolio screenshot memorable.

---

### Day 6–7 — Apr 25–26 · Buffer + Polish Pass
- Loading skeletons on lists
- Empty states ("No issues yet — create one")
- Error toasts on failed API calls
- Mobile-responsive check

---

## Week 3 — Apr 27–30: Stretch + Deploy

### Apr 27 · Comments (Stretch)
- `Comment` table: id, issue_id, user_id, body, created_at
- `GET /issues/:id/comments` + `POST /issues/:id/comments`
- FE: comment thread at bottom of issue detail

### Apr 28 · Activity Log (Stretch)
- Log every status change: "Rafi moved this to In Progress"
- `IssueActivity` table: issue_id, user_id, action, created_at
- Show timeline in issue detail

### Apr 29 · Deploy
- **Backend:** Railway (free tier, supports PostgreSQL + FastAPI)
- **Frontend:** Vercel (free, just connect the repo)
- Set real env vars (DATABASE_URL, SECRET_KEY, CORS origins)
- Test the live URL end-to-end

### Apr 30 · Portfolio Writeup
- README with: what it is, tech stack, how to run locally, live demo link
- Screenshot of the Kanban board
- Add to your portfolio site / LinkedIn

---

## Is This Doable in 18 Days?

**Core target (auth + projects + kanban): Yes, comfortably.**  
If you hit Days 1–5 of Week 2, you have a portfolio-ready app.

**Stretch goals (comments, activity log): Maybe.**  
Don't stress these. A polished core beats a bloated half-finished app.

**What will slow you down:**
- Alembic migrations going wrong (they will once — just `alembic downgrade -1` and retry)
- JWT debugging on the FE (CORS + Authorization header issues are common)
- dnd-kit setup for Kanban (takes a few hours the first time)

**What to do when stuck:** timebox to 45 min, then ask for help. Don't lose a whole day.

---

## Priority Order (If You Run Out of Time)

1. JWT Auth (BE + FE) — non-negotiable, every real app has this
2. Projects CRUD — gives the app structure
3. Kanban board — the visual centrepiece
4. Deploy — a live URL is worth 10x local screenshots
5. Comments — nice, but skippable
6. Activity log — bonus

---

## Quick Reference: Tech You'll Learn Each Week

| Week | New Concepts |
|------|-------------|
| 1 | pytest, JWT, passlib, FK relations, role-based access |
| 2 | Auth state management, route guards, dnd-kit, optimistic updates |
| 3 | Railway/Vercel deploy, env config, README writing |
