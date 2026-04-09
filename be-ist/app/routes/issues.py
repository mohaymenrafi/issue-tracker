from fastapi import APIRouter, Depends, HTTPException, Request, status
import uuid
from app.schemas import IssueCreate, IssueOut, IssuePriority, IssueStatus, IssueUpdate
from app.storage import load_data, save_data

router = APIRouter(prefix="/api/v1/issues", tags=["issues"])


def get_issues_db() -> list[IssueOut]:
    return load_data()


def get_issue_or_404(issue_id: str, issues: list[IssueOut] = Depends(get_issues_db)) -> IssueOut:
    issue = next((issue for issue in issues if issue["id"] == issue_id), None)
    if not issue:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Issue not found")
    return issue


@router.get("/", response_model=list[IssueOut])
def get_issues(status: IssueStatus = None, priority: IssuePriority = None, page: int = 1, limit: int = 10, issues: list = Depends(get_issues_db)):
    """Retrieves all issues"""
    start = (page - 1) * limit
    end = start + limit

    # these query needs to be added to the database later when we connect them
    if status:
        issues = [issue for issue in issues if issue["status"] == status]
    if priority:
        issues = [issue for issue in issues if issue["priority"] == priority]
    return issues[start:end]


@router.post("/", response_model=IssueOut, status_code=status.HTTP_201_CREATED)
def create_issue(payload: IssueCreate, issues: list = Depends(get_issues_db)):
    """Creates a new issue"""

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
def get_issue(issue: dict = Depends(get_issue_or_404)):
    """Retrieves an issue by its ID"""
    return issue


@router.patch("/{issue_id}", response_model=IssueOut, status_code=status.HTTP_200_OK)
def update_issue(payload: IssueUpdate, issues: list[IssueOut] = Depends(get_issues_db), issue: dict = Depends(get_issue_or_404)):
    """Updates an issue by its ID"""
    updates = payload.model_dump(exclude_unset=True)
    issue.update(updates)
    save_data(issues)
    return issue


@router.delete("/{issue_id}", status_code=status.HTTP_200_OK)
def delete_issue(issues: list[IssueOut] = Depends(get_issues_db), issue: dict = Depends(get_issue_or_404)):
    """Deletes an issue by its ID"""

    issues.remove(issue)
    save_data(issues)
    return {"message": "Issue deleted successfully"}
