# Relay — AI Features

**Model:** claude-haiku-4-5 (fast, cheap, structured extraction)  
**Pattern:** AI is always a translation layer only — it never touches the DB directly  
**Phase:** Post-deployment enhancements  
**Updated:** April 28, 2026

---

## Core Principle

Claude receives freeform user text and returns structured JSON.  
Your existing routes, validation, and DB logic run unchanged.  
If Claude fails or returns invalid data — fallback gracefully, never crash.

```
User text → Claude (haiku) → Pydantic schema → your existing route
```

---

## Feature 1 — Natural Language Issue Creation

### What it does
User describes a problem in plain English. Claude extracts a structured issue payload. Your existing `POST /issues` creates it.

### Example
```
User: "countries API is not working, it's blocking the frontend team, been down since this morning"

Claude extracts:
{
  "title": "Countries API not working",
  "description": "API has been down since this morning and is blocking the frontend team.",
  "priority": "high",
  "status": "open"
}

→ issue created → returned to user
```

### Endpoint
```
POST /ai/create-issue
Authorization: Bearer <token>
Body: {
  "prompt": "countries API is not working, blocking frontend team",
  "project_id": 3   ← optional, scopes the issue to a project
}

Response: {
  "issue": { ...created issue object... },
  "extracted": {
    "title": "Countries API not working",
    "description": "...",
    "priority": "high"
  }
}
```

Return both the created issue and what Claude extracted — FE shows "Created as: high priority · Countries API not working" so the user can verify.

### Pydantic extraction schema
```python
class AIIssueExtraction(BaseModel):
    title: str = Field(min_length=3, max_length=200)
    description: str = Field(min_length=5, max_length=1000)
    priority: IssuePriority = Field(default=IssuePriority.medium)
    # Claude never sets reporter_id, assignee_id, project_id — those come from context
```

### Claude prompt
```python
SYSTEM = """
You are an issue tracker assistant. Extract structured data from the user's description.
Return ONLY valid JSON matching this schema — no explanation, no markdown:
{
  "title": "short, clear issue title (max 10 words)",
  "description": "full description, cleaned and professional",
  "priority": "low" | "medium" | "high"
}
If priority is not mentioned, infer from urgency words (blocking, critical, urgent = high).
"""

USER = f"Create an issue from this: {prompt}"
```

### Implementation
```python
import anthropic
import json
from app.core.config import settings

client = anthropic.Anthropic(api_key=settings.anthropic_api_key)

def extract_issue_from_prompt(prompt: str) -> AIIssueExtraction:
    message = client.messages.create(
        model="claude-haiku-4-5",
        max_tokens=512,
        system=SYSTEM,
        messages=[{"role": "user", "content": f"Create an issue from this: {prompt}"}]
    )
    raw = message.content[0].text
    data = json.loads(raw)
    return AIIssueExtraction(**data)  # validates — raises if Claude hallucinated bad fields
```

### Fallback
```python
try:
    extracted = extract_issue_from_prompt(prompt)
except (json.JSONDecodeError, ValidationError):
    raise HTTPException(422, "Could not extract issue from that description. Try being more specific.")
```

### Route
```python
@router.post("/ai/create-issue")
async def ai_create_issue(
    body: AICreateIssueRequest,
    current_user: User = Depends(get_current_user),
    session: Session = Depends(get_session)
):
    extracted = extract_issue_from_prompt(body.prompt)

    issue = Issue(
        title=extracted.title,
        description=extracted.description,
        priority=extracted.priority,
        reporter_id=current_user.id,
        project_id=body.project_id,
    )
    session.add(issue)
    session.commit()
    session.refresh(issue)

    return { "issue": issue, "extracted": extracted }
```

---

## Feature 2 — Natural Language Issue Query

### What it does
User asks a question in plain English. Claude extracts filter parameters. Your existing `GET /issues` runs with those filters. FE shows both the results and what was interpreted.

### Examples
```
"show me high priority issues this week"
→ { "priority": "high", "created_after": "2026-04-21" }

"what's open and assigned to me"
→ { "status": "open", "assignee_id": <current_user.id> }

"anything critical that's not closed"
→ { "priority": "high", "status": ["open", "in_progress"] }

"all issues Rafi created last month"
→ { "reporter_username": "rafi", "created_after": "2026-03-01", "created_before": "2026-03-31" }
```

### Endpoint
```
POST /ai/query
Authorization: Bearer <token>  ← optional, needed for "assigned to me"
Body: {
  "prompt": "show me high priority issues this week",
  "project_id": 3   ← optional, scope to a project
}

Response: {
  "issues": [ ...matching issues... ],
  "filters": {
    "priority": "high",
    "created_after": "2026-04-21"
  },
  "interpreted_as": "High priority · Created this week"
}
```

### Pydantic extraction schema
```python
class AIQueryFilters(BaseModel):
    status: IssueStatus | None = None
    priority: IssuePriority | None = None
    assignee_id: int | None = None
    reporter_id: int | None = None
    created_after: datetime | None = None
    created_before: datetime | None = None
```

### Claude prompt
```python
SYSTEM = """
You are an issue tracker query assistant. Today's date is {today}.
The current user's ID is {user_id} (use this when the user says "me", "my", "assigned to me").

Extract query filters from the user's request.
Return ONLY valid JSON — no explanation, no markdown:
{
  "status": "open" | "in_progress" | "closed" | null,
  "priority": "low" | "medium" | "high" | null,
  "assignee_id": <int> | null,
  "reporter_id": <int> | null,
  "created_after": "YYYY-MM-DD" | null,
  "created_before": "YYYY-MM-DD" | null
}

Date rules:
- "this week" → created_after = last Monday
- "last week" → created_after/before = previous Mon–Sun
- "this month" → created_after = first of current month
- "today" → created_after = today
- "this sprint" → treat as "this week" unless sprint dates are given

If nothing can be extracted, return all nulls — never guess.
"""
```

### Implementation
```python
def extract_query_filters(prompt: str, current_user_id: int) -> AIQueryFilters:
    today = datetime.utcnow().date().isoformat()

    message = client.messages.create(
        model="claude-haiku-4-5",
        max_tokens=256,
        system=SYSTEM.format(today=today, user_id=current_user_id),
        messages=[{"role": "user", "content": prompt}]
    )
    raw = message.content[0].text
    data = json.loads(raw)
    return AIQueryFilters(**data)
```

### Route
```python
@router.post("/ai/query")
async def ai_query_issues(
    body: AIQueryRequest,
    current_user: User | None = Depends(get_optional_user),
    session: Session = Depends(get_session)
):
    user_id = current_user.id if current_user else None

    try:
        filters = extract_query_filters(body.prompt, user_id)
    except (json.JSONDecodeError, ValidationError):
        filters = AIQueryFilters()  # all nulls — return unfiltered

    query = select(Issue)
    if filters.status:
        query = query.where(Issue.status == filters.status)
    if filters.priority:
        query = query.where(Issue.priority == filters.priority)
    if filters.assignee_id:
        query = query.where(Issue.assignee_id == filters.assignee_id)
    if filters.reporter_id:
        query = query.where(Issue.reporter_id == filters.reporter_id)
    if filters.created_after:
        query = query.where(Issue.created_at >= filters.created_after)
    if filters.created_before:
        query = query.where(Issue.created_at <= filters.created_before)
    if body.project_id:
        query = query.where(Issue.project_id == body.project_id)

    issues = session.exec(query).all()

    return {
        "issues": issues,
        "filters": filters,
        "interpreted_as": build_human_label(filters)  # "High priority · This week"
    }
```

---

## Feature 3 — Time-Range Summary

### What it does
User asks for a summary of work done over a time period. No sprint model needed — "this week", "last week", "this month" are just date filters. Claude extracts the range, you fetch closed issues, Claude summarises them.

### Examples
```
"summarise this week's closed issues"
"what got done last week?"
"give me a summary of this month's resolved issues"
```

### How it works
```
1. Claude extracts the time range from the prompt
   "this week" → { "created_after": "2026-04-21", "created_before": "2026-04-28" }

2. You fetch: issues where status=closed + within that date range + project_id (optional)

3. Pass the issue list back to Claude for a human-readable summary

4. Return summary + the issues used
```

### Endpoint
```
POST /ai/summarise
Authorization: Bearer <token>  ← optional
Body: {
  "prompt": "summarise this week's closed issues",
  "project_id": 3   ← optional, scope to a project
}

Response: {
  "summary": "This week, 7 issues were resolved. Key fixes include the Countries API outage, a login bug on mobile, and a pagination crash on the issue list.",
  "period": { "from": "2026-04-21", "to": "2026-04-28" },
  "issues_used": [ ...issue list... ]
}
```

### Step 1 — Extract date range (reuses AIQueryFilters)
```python
RANGE_SYSTEM = """
Today's date is {today}.
Extract a date range from the user's request.
Return ONLY valid JSON — no explanation, no markdown:
{
  "created_after": "YYYY-MM-DD" | null,
  "created_before": "YYYY-MM-DD" | null
}

Date rules:
- "this week"  → created_after = last Monday, created_before = today
- "last week"  → created_after/before = previous Mon–Sun
- "this month" → created_after = first of current month, created_before = today
- "today"      → created_after = today, created_before = today
If no time range mentioned, return both as null.
"""
```

### Step 2 — Summarise the fetched issues
```python
SUMMARY_SYSTEM = """
You are a project assistant. Summarise the following resolved issues in 2–4 sentences.
Be concise and professional. Mention the count, highlight key fixes, and note any patterns.
"""

def summarise_issues(issues: list[Issue]) -> str:
    if not issues:
        return "No issues were resolved in this period."

    payload = [
        {"title": i.title, "priority": i.priority.value}
        for i in issues
    ]

    message = client.messages.create(
        model="claude-haiku-4-5",
        max_tokens=300,
        system=SUMMARY_SYSTEM,
        messages=[{
            "role": "user",
            "content": f"Issues resolved:\n{json.dumps(payload, indent=2)}"
        }]
    )
    return message.content[0].text
```

### Full route
```python
@router.post("/ai/summarise")
async def ai_summarise(
    body: AISummariseRequest,
    current_user: User | None = Depends(get_optional_user),
    session: Session = Depends(get_session)
):
    # Step 1 — extract date range
    try:
        date_range = extract_date_range(body.prompt)
    except (json.JSONDecodeError, ValidationError):
        date_range = AIQueryFilters()  # no range — will return all closed issues

    # Step 2 — fetch closed issues in that range
    query = select(Issue).where(Issue.status == IssueStatus.closed)
    if date_range.created_after:
        query = query.where(Issue.created_at >= date_range.created_after)
    if date_range.created_before:
        query = query.where(Issue.created_at <= date_range.created_before)
    if body.project_id:
        query = query.where(Issue.project_id == body.project_id)

    issues = session.exec(query).all()

    # Step 3 — summarise
    summary = summarise_issues(issues)

    return {
        "summary": summary,
        "period": {
            "from": date_range.created_after,
            "to": date_range.created_before
        },
        "issues_used": issues
    }
```

---

## Feature 4 — Bulk Action via Natural Language (stretch)

### What it does
User issues a command that affects multiple issues at once.

### Examples
```
"close all issues labelled bug that are older than 2 weeks"
"assign all high priority open issues to Rafi"
"move all issues in the auth project to in_progress"
```

### How it works
```
POST /ai/bulk-action
Body: { "prompt": "close all bug issues older than 2 weeks", "project_id": 3 }

→ Claude extracts:
  {
    "action": "update_status",
    "target_filters": { "label": "bug", "older_than_days": 14 },
    "update": { "status": "closed" }
  }
→ fetch matching issues
→ show user: "This will close 6 issues. Confirm?"
→ on confirm → apply updates
```

Always require a confirmation step before bulk writes. Never auto-apply.

---

## Feature 5 — Assignee Suggestion (stretch)

### What it does
When creating an issue, Claude looks at the issue content and current member workload and suggests who should own it.

### How it works
```
POST /ai/suggest-assignee
Body: { "issue_title": "...", "description": "...", "project_id": 3 }

→ fetch project members + their open issue count
→ send to Claude with issue context
→ Claude returns: { "suggested_user_id": 4, "reason": "Rafi has the fewest open issues and this is a backend task" }
```

---

## Build Order

```
Feature 1  →  NL issue creation     (most impressive, build first)
Feature 2  →  NL issue query        (already in original roadmap)
Feature 3  →  Time-range summary    (lightweight, high value — no sprint model needed)
Feature 4  →  Bulk actions          (stretch — needs confirmation UX)
Feature 5  →  Assignee suggestion   (stretch — needs member workload data)
```

---

## Setup

```bash
pip install anthropic
```

```python
# app/core/config.py
class Settings(BaseSettings):
    anthropic_api_key: str
```

```python
# app/core/ai.py  ← shared AI client, imported by all AI routes
import anthropic
from app.core.config import settings

client = anthropic.Anthropic(api_key=settings.anthropic_api_key)
```

All AI routes live in `app/routes/ai.py`, mounted at `/api/v1/ai`.

---

## Cost Estimate

| Feature | Tokens per call (approx) | Cost per 1000 calls |
|---------|--------------------------|---------------------|
| Create issue | ~300 in + ~100 out | ~$0.04 |
| Query | ~250 in + ~80 out | ~$0.03 |
| Summary (haiku) | ~800 in + ~200 out | ~$0.10 |

claude-haiku-4-5 is $0.08/MTok input, $0.40/MTok output.  
At normal portfolio traffic — effectively free.

---

## Error Handling Rules

1. Claude returns invalid JSON → catch `json.JSONDecodeError` → fallback, never 500
2. Claude returns valid JSON but fails Pydantic validation → catch `ValidationError` → fallback
3. Anthropic API is down → catch `anthropic.APIError` → return 503 with clear message
4. AI routes should never block the main app — wrap in try/except at every level
5. Log every AI call: prompt, extracted result, latency — useful for debugging + portfolio demo
