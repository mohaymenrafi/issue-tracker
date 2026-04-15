from fastapi import APIRouter, Depends, HTTPException, status
from sqlmodel import Session, select
from app.database import get_session
from app.models.issues import Issue, IssueCreate, IssuePriority, IssueStatus, IssueUpdate

router = APIRouter(prefix="/api/v1/issues", tags=["issues"])


def get_issue_or_404(issue_id: int, session: Session = Depends(get_session)) -> Issue:
    issue = session.get(Issue, issue_id)
    if not issue:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Issue not found")
    return issue


@router.get('/', response_model=list[Issue])
def get_issues(status: IssueStatus = None, priority: IssuePriority = None, limit: int = 10, page: int = 1, session: Session = Depends(get_session)):
    """Retrieves all issues"""
    query = select(Issue)
    if status:
        query = query.where(Issue.status == status)
    if priority:
        query = query.where(Issue.priority == priority)

    query = query.offset((page - 1) * limit).limit(limit)
    return session.exec(query).all()


@router.post('/', response_model=Issue, status_code=status.HTTP_201_CREATED)
def create_issue(payload: IssueCreate, session: Session = Depends(get_session)):
    """Creates a new issue"""
    new_issue = Issue.model_validate(payload)
    session.add(new_issue)
    session.commit()
    session.refresh(new_issue)
    return new_issue


@router.get("/{issue_id}", response_model=Issue, status_code=status.HTTP_200_OK)
def get_issue(issue: Issue = Depends(get_issue_or_404)):
    """Retrieves an issue by its ID"""
    return issue


@router.patch("/{issue_id}", response_model=Issue, status_code=status.HTTP_200_OK)
def update_issue(payload: IssueUpdate, issue: Issue = Depends(get_issue_or_404), session: Session = Depends(get_session)):
    """Updates an issue by its ID"""
    updates = payload.model_dump(exclude_unset=True)
    issue.sqlmodel_update(updates)
    session.add(issue)
    session.commit()
    session.refresh(issue)
    return issue


@router.delete("/{issue_id}", status_code=status.HTTP_200_OK)
def delete_issue(issue: Issue = Depends(get_issue_or_404), session: Session = Depends(get_session)):
    """Deletes an issue by its ID"""
    session.delete(issue)
    session.commit()
    return {"message": "Issue deleted successfully"}
