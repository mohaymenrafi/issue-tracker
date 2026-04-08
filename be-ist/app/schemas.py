from enum import Enum
from pydantic import BaseModel, Field
from typing import Optional


class IssueStatus(str, Enum):
    open = "open"
    closed = "closed"
    in_progress = "in_progress"


class IssuePriority(str, Enum):
    low = "low"
    medium = "medium"
    high = "high"


class IssueCreate(BaseModel):
    title: str = Field(min_length=3, max_length=100,
                       description="Then title of the issue")
    description: str = Field(min_length=5, max_length=1000)
    priority: IssuePriority = IssuePriority.medium


class IssueUpdate(BaseModel):
    title: Optional[str] = Field(default=None, min_length=3, max_length=100,
                                 description="Then title of the issue")
    description: Optional[str] = Field(
        default=None, min_length=5, max_length=1000)
    priority: Optional[IssuePriority] = None
    status: Optional[IssueStatus] = None


class IssueOut(BaseModel):
    id: str
    title: str
    description: str
    priority: IssuePriority
    status: IssueStatus
