from fastapi import APIRouter, HTTPException, Request, status
import uuid
from app.schemas import IssueCreate, IssueOut, IssuePriority, IssueStatus, IssueUpdate
from app.storage import load_data, save_data

router = APIRouter(prefix="/api/v1/issues", tags=["issues"])


@router.get("/", response_model=list[IssueOut])
def get_issues(status: IssueStatus = None, priority: IssuePriority = None, page: int = 1, limit: int = 10):
    """Retrieves all issues"""
    issues = load_data()
    start = (page - 1) * limit
    end = start + limit

    # these query needs to be added to the database later when we connect them
    if status:
        issues = [issue for issue in issues if issue["status"] == status]
    if priority:
        issues = [issue for issue in issues if issue["priority"] == priority]
    return issues[start:end]


@router.post("/", response_model=IssueOut, status_code=status.HTTP_201_CREATED)
def create_issue(payload: IssueCreate):
    """Creates a new issue"""

    issues = load_data()
    new_issue = {
        "id": str(uuid.uuid4()),
        "title": payload.title,
        "description": payload.description,
        "priority": payload.priority,
        "status": IssueStatus.open
    }
    issues.append(new_issue)
    save_data(issues)
    return new_issue


@router.get("/{issue_id}", response_model=IssueOut, status_code=status.HTTP_200_OK)
def get_issue(issue_id: str):
    """Retrieves an issue by its ID"""
    issues = load_data()
    issue = next((issue for issue in issues if issue["id"] == issue_id), None)
    if not issue:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Issue not found")
    return issue


@router.patch("/{issue_id}", response_model=IssueOut, status_code=status.HTTP_200_OK)
def update_issue(issue_id: str, payload: IssueUpdate):
    """Updates an issue by its ID"""
    issues = load_data()
    issue = next((issue for issue in issues if issue['id'] == issue_id), None)
    if not issue:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Issue not found"
        )
    if payload.title:
        issue['title'] = payload.title
    if payload.description:
        issue['description'] = payload.description
    if payload.priority:
        issue['priority'] = payload.priority
    if payload.status:
        issue['status'] = payload.status
    save_data(issues)
    return issue


@router.delete("/{issue_id}", status_code=status.HTTP_200_OK)
def delete_issue(issue_id: str):
    """Deletes an issue by its ID"""
    issues = load_data()
    issue = next((issue for issue in issues if issue['id'] == issue_id), None)
    if not issue:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Issue not found"
        )
    issues.remove(issue)
    save_data(issues)
    return {"message": "Issue deleted successfully"}
