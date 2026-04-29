from typing import Literal
from datetime import datetime, timezone
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlmodel import Session, select
from app.database import get_session
from app.models.issues import Issue, IssueCreate, IssuePriority, IssueStatus, IssueUpdate
from app.core.auth import get_current_user
from app.models.users import User


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


def get_issue_or_404(issue_id: int, session: Session = Depends(get_session)) -> Issue:
    issue = session.get(Issue, issue_id)
    if not issue:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Issue not found")
    return issue


@router.get('', response_model=list[Issue])
def get_issues(status: IssueStatus = None, priority: IssuePriority = None, limit: int = Query(10, ge=1, le=100), page: int = Query(1, ge=1), sort: IssueSort = '-created_at', session: Session = Depends(get_session)):
    """Retrieves all issues"""
    query = select(Issue)
    offset = (page - 1) * limit

    if status:
        query = query.where(Issue.status == status)
    if priority:
        query = query.where(Issue.priority == priority)

    col, descending = _issue_order(sort)
    if descending:
        query = query.order_by(col.desc(), Issue.id.desc())
    else:
        query = query.order_by(col.asc(), Issue.id.asc())

    query = query.offset(offset).limit(limit)
    return session.exec(query).all()


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
    session.delete(issue)
    session.commit()
    return {"message": "Issue deleted successfully"}
