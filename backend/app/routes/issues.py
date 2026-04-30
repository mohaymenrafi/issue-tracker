from typing import Literal
from datetime import datetime, timezone
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlmodel import Session, func, select
from app.database import get_session
from app.models.issues import Issue, IssueCreate, IssueListResponse, IssuePriority, IssueStatus, IssueUpdate
from app.core.auth import get_current_user
from app.models.users import User
from app.models.projects import Project


router = APIRouter(prefix="/api/v1/issues", tags=["issues"])

IssueSort = Literal[
    'created_at',
    '-created_at',
    'updated_at',
    '-updated_at',
]


def _issue_order(sort: IssueSort):
    """Return (primary_column, descending) for Issue"""
    mapping = {
        'created_at': (Issue.created_at, False),
        '-created_at': (Issue.created_at, True),
        'updated_at': (Issue.updated_at, False),
        '-updated_at': (Issue.updated_at, True),
    }
    return mapping[sort]


def _has_update_or_delete_access(issue: Issue, session: Session, user: User) -> bool:
    if issue.reporter_id == user.id:
        return True
    if issue.project_id is None:
        return False
    project = session.get(Project, issue.project_id)
    if project is None:
        return False
    return project.owner_id == user.id


def get_issue_or_404(issue_id: int, session: Session = Depends(get_session)) -> Issue:
    issue = session.get(Issue, issue_id)
    if not issue:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Issue not found")
    return issue


@router.get('', response_model=IssueListResponse)
def get_issues(issue_status: IssueStatus = Query(default=None, alias='status'), priority: IssuePriority = None, limit: int = Query(default=10, ge=1, le=100), page: int = Query(default=1, ge=1), sort: IssueSort = '-created_at', project_id: str | None = Query(default=None), session: Session = Depends(get_session)):
    """Retrieves all issues"""
    offset = (page - 1) * limit

    filters = []

    if issue_status:
        filters.append(Issue.status == issue_status)
    if priority:
        filters.append(Issue.priority == priority)
    if project_id == 'null':
        filters.append(Issue.project_id.is_(None))
    elif project_id is not None:
        try:
            filters.append(Issue.project_id == int(project_id))
        except ValueError:
            raise HTTPException(
                status_code=status.HTTP_422_UNPROCESSABLE_CONTENT,
                detail="project_id must be an integer or null"
            )

    query = select(Issue).where(*filters)
    total_query = select(func.count()).select_from(Issue).where(*filters)
    total = session.exec(total_query).one()

    col, descending = _issue_order(sort)
    if descending:
        query = query.order_by(col.desc(), Issue.id.desc())
    else:
        query = query.order_by(col.asc(), Issue.id.asc())

    query = query.offset(offset).limit(limit)

    return {
        "issues": session.exec(query).all(),
        "total": total
    }


@router.post('', response_model=Issue, status_code=status.HTTP_201_CREATED)
def create_issue(
    payload: IssueCreate,
    session: Session = Depends(get_session),
    current_user: User = Depends(get_current_user)
):
    """Creates a new issue"""
    new_issue = Issue.model_validate(payload)
    new_issue.reporter_id = current_user.id if current_user else None
    session.add(new_issue)
    session.commit()
    session.refresh(new_issue)
    return new_issue


@router.get("/{issue_id}", response_model=Issue, status_code=status.HTTP_200_OK)
def get_issue(issue: Issue = Depends(get_issue_or_404)):
    """Retrieves an issue by its ID"""
    return issue


@router.patch("/{issue_id}", response_model=Issue, status_code=status.HTTP_200_OK)
def update_issue(payload: IssueUpdate, issue: Issue = Depends(get_issue_or_404), session: Session = Depends(get_session), current_user: User = Depends(get_current_user)):
    """Updates an issue by its ID"""

    if not _has_update_or_delete_access(issue, session, current_user):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN, detail="You don't have access to edit this issue"
        )

    updates = payload.model_dump(exclude_unset=True)
    updates["updated_at"] = datetime.now(timezone.utc)
    issue.sqlmodel_update(updates)
    session.add(issue)
    session.commit()
    session.refresh(issue)
    return issue


@router.delete("/{issue_id}", status_code=status.HTTP_200_OK)
def delete_issue(issue: Issue = Depends(get_issue_or_404), session: Session = Depends(get_session), current_user: User = Depends(get_current_user)):
    """Deletes an issue by its ID"""
    if not _has_update_or_delete_access(issue, session, current_user):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN, detail="You don't have access to delete this issue"
        )
    session.delete(issue)
    session.commit()
    return {"message": "Issue deleted successfully"}
