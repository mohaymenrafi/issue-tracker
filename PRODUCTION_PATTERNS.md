# Production Patterns & Bottlenecks

These are real problems that break production backends.
Tackle these after the core roadmap (ROADMAP_v2.md) is complete.
Each one is also an interview talking point — know the what, why, and how.

---

## 1. N+1 Query Problem

**What:** Fetching a list, then making 1 DB call per row to get related data. 20 issues = 21 queries.

**Why it hurts:** Invisible in dev with 5 rows. In prod with 500 rows and concurrent users, your DB chokes.

**The fix:** Eager loading — fetch related data in one query, not one per row.

```python
# bad — 1 query per issue
issues = session.exec(select(Issue)).all()
for issue in issues:
    reporter = session.get(User, issue.reporter_id)

# good — 2 queries total regardless of issue count
issues = session.exec(
    select(Issue).options(selectinload(Issue.reporter))
).all()
```

**Where it'll hit you in Relay:** Issue list returning reporter + assignee names. Activity log returning user info per entry.

- [ ] Audit all list endpoints for N+1 — use `selectinload` or `joinedload` where needed
- [ ] Verify with query logging (`echo=True` on engine) — count queries per request

**Interview angle:** "I identified N+1 queries on the issue list endpoint. With 200 issues it was making 401 DB calls. I fixed it with SQLAlchemy eager loading and brought it down to 2 queries."

---

## 2. Race Conditions on Concurrent Writes

**What:** Two users read the same row simultaneously, both modify it, one silently overwrites the other.

**Why it hurts:** No error thrown, no warning. Data is just wrong. You only find out when users complain.

**The fix:** Optimistic locking — add a `version` column. Check it hasn't changed before writing. If it has, return 409 Conflict.

```python
class Issue(SQLModel, table=True):
    version: int = Field(default=1)

# on update
issue = session.get(Issue, issue_id)
if issue.version != body.version:
    raise HTTPException(409, "Issue was modified by someone else. Refresh and try again.")

issue.status = body.status
issue.version += 1
session.commit()
```

**Where it'll hit you in Relay:** Two users updating the same issue status simultaneously. Bulk AI actions applied concurrently.

- [ ] Add `version` column to Issue model + migration
- [ ] Enforce version check on PATCH /issues/:id
- [ ] Return 409 with a clear message so the FE can handle it

**Interview angle:** "I added optimistic locking to issue updates. If two users edit the same issue simultaneously, the second write returns a 409 and the frontend prompts the user to refresh — no silent data loss."

---

## 3. Database Connection Pool Exhaustion

**What:** 200 concurrent requests each hold a DB connection for 500ms. Your Postgres max_connections is 100. Everything hangs.

**Why it hurts:** Looks like the app is down. No obvious error. Every request times out.

**The fix:**
- Use an async DB driver (`asyncpg` instead of `psycopg2-binary`)
- Tune pool size to match Postgres `max_connections`
- Keep transactions short — open, write, close immediately

```python
# async engine with pool tuning
engine = create_async_engine(
    settings.database_url,
    pool_size=10,        # max connections in pool
    max_overflow=20,     # extra connections allowed under load
    pool_timeout=30,     # wait max 30s for a connection before raising
)
```

**Where it'll hit you in Relay:** WebSocket connections + high API traffic competing for DB connections simultaneously.

- [ ] Switch to `asyncpg` + `SQLModel async session`
- [ ] Configure pool size based on Hetzner plan's Postgres limits
- [ ] Add pool exhaustion logging — alert when wait time > 1s

**Interview angle:** "Under load testing I saw connection pool exhaustion. Switched to asyncpg, tuned pool_size to match Postgres max_connections, and kept transactions short. Response times dropped from timeouts to under 200ms."

---

## 4. Missing Database Indexes

**What:** Queries that run in 2ms in dev (50 rows) run in 4 seconds in prod (500k rows) because there's no index.

**Why it hurts:** Full table scan on every query. The more data, the worse it gets. Exponential degradation.

**The fix:** Index every FK column and every column you filter or sort by.

```python
# migration — add indexes
op.create_index("ix_issue_project_id", "issue", ["project_id"])
op.create_index("ix_issue_reporter_id", "issue", ["reporter_id"])
op.create_index("ix_issue_assignee_id", "issue", ["assignee_id"])
op.create_index("ix_issue_status", "issue", ["status"])
op.create_index("ix_projectmember_user_id", "projectmember", ["user_id"])
op.create_index("ix_activitylog_project_id", "activitylog", ["project_id"])
op.create_index("ix_activitylog_issue_id", "activitylog", ["issue_id"])
op.create_index("ix_notification_user_id", "notification", ["user_id"])
```

**How to verify:** Use `EXPLAIN ANALYZE` in Postgres. Look for "Seq Scan" on large tables — that's a missing index.

```sql
EXPLAIN ANALYZE SELECT * FROM issue WHERE project_id = 3 AND status = 'open';
```

- [ ] Add index migration for all FK + filter columns (already in Phase 7)
- [ ] Run `EXPLAIN ANALYZE` on the 5 most common queries after seeding test data
- [ ] Add composite index on `(project_id, status)` — the most common combined filter

**Interview angle:** "I used EXPLAIN ANALYZE to identify a sequential scan on the issue table. Added a composite index on (project_id, status) — the most common filter combination — and query time dropped from 3.2s to 8ms."

---

## 5. Silent Background Task Failures

**What:** A background task (email, notification, activity log) throws an error. FastAPI swallows it. No log, no retry, no alert. The user never knows their notification wasn't sent.

**Why it hurts:** Complete silence. You have no idea how many notifications have been silently failing for weeks.

**The fix:** Always wrap background tasks in try/except with logging. For critical tasks, store a record so you can retry.

```python
# bad — FastAPI silently swallows this exception
async def send_email_task(to: str, subject: str, body: str):
    resend.Emails.send(...)  # if this throws, nobody knows

# good — catch, log, and optionally store for retry
async def send_email_task(to: str, subject: str, html: str):
    try:
        resend.Emails.send({"from": ..., "to": to, "subject": subject, "html": html})
    except Exception as e:
        logger.error(f"Email failed to {to}: {e}")
        # optionally: write a FailedJob row to DB for manual retry
```

**Where it'll hit you in Relay:** Password reset email fails silently → user thinks they're locked out. Notification never sent → user misses an assignment.

- [ ] Wrap every background task in try/except with structured logging
- [ ] Add a `FailedJob` table for critical tasks (email, password reset) that must not be lost
- [ ] Log task start + completion time — makes it easy to see which tasks are slow

**Interview angle:** "I discovered our password reset emails were failing silently in background tasks. Added structured error logging and a FailedJob table for retry — now we have full visibility into delivery failures."

---

## 6. External Service as a Single Point of Failure

**What:** Claude API goes down. Every `/ai/*` request hangs indefinitely, holding a thread. Your entire API becomes slow or unresponsive — not just AI routes.

**Why it hurts:** One third-party outage takes down your whole app, not just one feature.

**The fix:** Always set timeouts. Return a degraded response fast rather than hang.

```python
# bad — hangs indefinitely if Claude is down
client.messages.create(model="claude-haiku-4-5", ...)

# good — fail fast
try:
    response = client.messages.create(
        model="claude-haiku-4-5",
        timeout=5.0,   # never wait more than 5 seconds
        ...
    )
except anthropic.APITimeoutError:
    raise HTTPException(503, "AI service temporarily unavailable. Try again shortly.")
except anthropic.APIError as e:
    logger.error(f"Claude API error: {e}")
    raise HTTPException(503, "AI service error.")
```

**Circuit breaker pattern:** If Claude fails 5 times in 60 seconds, stop calling it for the next 60 seconds and return the fallback immediately — don't even try.

**Where it'll hit you in Relay:** Claude down → AI routes hang → connection pool fills up → all routes slow → app looks down.

- [ ] Set 5s timeout on all Claude API calls
- [ ] Set 3s timeout on all Resend email calls
- [ ] Return graceful 503 with clear message on external service failure
- [ ] Log every external call with latency — alert if p95 > 2s

**Interview angle:** "I set strict timeouts on all third-party calls after Claude's API caused a cascade — hanging requests filled the connection pool and took down unrelated routes. Fail fast and return a 503 immediately."

---

## 7. Auth Token Edge Cases

**What:** Security holes that only appear in production with real users doing unexpected things.

**The three that get everyone:**

### a) Refresh token race condition
Two browser tabs refresh the token simultaneously. Both succeed. Now there are two valid tokens where there should be one. Fix: use a DB transaction + mark the old token as used atomically.

```python
with session.begin():
    token = session.exec(
        select(RefreshToken).where(RefreshToken.token_hash == hashed).with_for_update()
    ).first()
    if not token or token.revoked:
        raise HTTPException(401, "Invalid token")
    token.revoked = True
    new_token = RefreshToken(user_id=token.user_id, ...)
    session.add(new_token)
# commit happens here — atomic, no race
```

### b) Logout doesn't actually log out
Deleting a JWT from localStorage doesn't invalidate it. Someone who stole that token still has 15 minutes of access. Fix: on logout, revoke the refresh token in the DB. On any request, check the refresh token isn't revoked.

### c) Password reset doesn't kill existing sessions
User resets password because they suspect compromise. All their old sessions remain live. Fix: on password reset, revoke ALL refresh tokens for that user.

```python
# when password is reset
session.exec(
    update(RefreshToken)
    .where(RefreshToken.user_id == user.id)
    .values(revoked=True)
)
```

- [ ] Use `SELECT ... FOR UPDATE` on refresh token rotation to prevent race condition
- [ ] POST /auth/logout revokes refresh token in DB
- [ ] POST /auth/reset-password revokes all refresh tokens for that user

**Interview angle:** "I found that password reset didn't invalidate existing sessions. Added logic to revoke all refresh tokens on reset — if someone's account is compromised, resetting the password actually locks out the attacker."

---

## 8. Offset Pagination Degrading at Scale

**What:** `LIMIT 20 OFFSET 10000` sounds fine. But the DB still scans all 10,000 rows before returning 20. At page 500 with heavy traffic, it's a full table scan every time.

**Why it hurts:** O(n) per page. The deeper the page, the slower the query. Linear with data growth.

**Offset (what you have now):**
```sql
SELECT * FROM issue ORDER BY created_at DESC LIMIT 20 OFFSET 10000;
-- scans 10,020 rows to return 20
```

**Cursor-based (how Linear, GitHub, Stripe paginate):**
```sql
SELECT * FROM issue WHERE created_at < '2026-04-01' ORDER BY created_at DESC LIMIT 20;
-- uses the index directly — O(1) regardless of position
```

```python
# cursor response
{
  "issues": [...],
  "next_cursor": "2026-03-28T14:22:00",  # the created_at of the last item
  "has_more": true
}

# next request
GET /issues?cursor=2026-03-28T14:22:00&limit=20
```

**For Relay:** Offset is fine to ship. Know cursor pagination for interviews and implement it as an upgrade.

- [ ] Ship offset pagination first (already implemented)
- [ ] Implement cursor pagination on `/issues` and `/projects/:id/activity` as an upgrade
- [ ] Document the tradeoff in README — shows you know the limitation

**Interview angle:** "I shipped offset pagination initially for simplicity, then migrated the high-volume endpoints to cursor-based pagination. Offset at page 500 was doing a 10,000 row scan — cursor pagination brought that to a constant-time index lookup."

---

## 9. Partial Writes Without Transactions

**What:** Multiple DB writes in one request. If write 2 or 3 fails, write 1 already committed. Now your data is inconsistent.

**Why it hurts:** No error raised — the partial state just silently exists. Activity logs pointing to non-existent issues. Notifications for actions that were never completed.

**The fix:** One transaction per request. All writes commit together or all roll back.

```python
# bad — three separate commits, partially writable
session.add(issue); session.commit()
session.add(activity); session.commit()
session.add(notification); session.commit()  # if this fails, issue + activity exist without notification

# good — one commit, atomic
session.add(issue)
session.add(activity)
session.add(notification)
session.commit()  # all or nothing
```

SQLModel sessions support this by default — just don't call `session.commit()` multiple times in one request.

**Where it'll hit you in Relay:** Create issue + write activity log + create notification. If notification insert fails, you have a ghost activity log entry.

- [ ] Audit all routes that do multiple writes — ensure single commit per request
- [ ] Wrap complex operations in explicit `try/except` with `session.rollback()` on failure

**Interview angle:** "I wrapped all multi-write operations in a single transaction. Before that, a failed notification insert would leave an orphaned activity log entry — inconsistent state with no error raised."

---

## 10. Observability Gaps

**What:** Something breaks in production at 3am. No structured logs, no metrics, no alerts. You have no idea where to start.

**Why it hurts:** Mean time to recovery (MTTR) is hours instead of minutes. You're guessing.

**The minimum you need in prod:**

```python
# every request — method, path, status, duration, user_id
logger.info({
    "event": "request",
    "method": request.method,
    "path": request.url.path,
    "status": response.status_code,
    "duration_ms": duration,
    "user_id": getattr(request.state, "user_id", None)
})

# every error — full context
logger.error({
    "event": "error",
    "path": request.url.path,
    "error": str(exc),
    "traceback": traceback.format_exc(),
    "user_id": getattr(request.state, "user_id", None)
})
```

**The three things that tell you everything:**
1. Error rate — % of requests returning 5xx (alert if > 1%)
2. Response time — p95 latency (alert if > 1s)
3. Health check — uptime monitoring pings `/health` every 30s (alert if it fails)

Coolify + Hetzner gives you basic metrics. Add structured JSON logs and you can plug into any log aggregator later (Datadog, Grafana, etc.).

- [ ] JSON structured logging on every request (already in Phase 7)
- [ ] `GET /health` endpoint (already in Phase 7)
- [ ] Set up uptime monitoring on the live URL (UptimeRobot — free)
- [ ] Log all 5xx errors with full stack trace + request context

**Interview angle:** "I implemented structured JSON logging from the start — every request logs method, path, status, duration, and user_id. When something breaks in prod I can filter logs by user_id or path and find the exact failing request in under a minute."

---

## Checklist Summary

| Pattern | Status | Interview Ready |
|---------|--------|-----------------|
| N+1 Query fix | ⬜ | ⬜ |
| Optimistic locking (race conditions) | ⬜ | ⬜ |
| Connection pool tuning | ⬜ | ⬜ |
| DB indexes + EXPLAIN ANALYZE | ⬜ | ⬜ |
| Background task error handling | ⬜ | ⬜ |
| External service timeouts + fallback | ⬜ | ⬜ |
| Auth token edge cases | ⬜ | ⬜ |
| Cursor pagination | ⬜ | ⬜ |
| Single-transaction multi-writes | ⬜ | ⬜ |
| Structured logging + observability | ⬜ | ⬜ |
