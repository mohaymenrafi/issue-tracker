from enum import Enum
from typing import Optional
from sqlmodel import Field, SQLModel
from datetime import datetime


class IssueStatus(str, Enum):
    OPEN = "open"
    IN_PROGRESS = "in_progress"
    CLOSED = "closed"


class IssuePriority(str, Enum):
    LOW = "low"
    MEDIUM = "medium"
    HIGH = "high"


class IssueBase(SQLModel):
    title: str = Field(min_length=3, max_length=200,
                       description="The title of the issue")
    description: str = Field(
        min_length=5, max_length=1000, description="The description of the issue")
    priority: IssuePriority = Field(
        default=IssuePriority.MEDIUM, description="The priority of the issue")
    status: IssueStatus = Field(
        default=IssueStatus.OPEN, description="The status of the issue")
    created_at: datetime = Field(
        default_factory=datetime.now, description="The date and time the issue was created")
    updated_at: datetime = Field(default_factory=datetime.now,
                                 description="The date and time the issue was last updated")


class Issue(IssueBase, table=True):
    id: int | None = Field(default=None, primary_key=True)


class IssueCreate(IssueBase):
    pass


class IssueUpdate(SQLModel):
    title: Optional[str] = Field(default=None, min_length=3, max_length=100,
                                 description="The title of the issue")
    description: Optional[str] = Field(
        default=None, min_length=5, max_length=1000)
    priority: Optional[IssuePriority] = None
    status: Optional[IssueStatus] = None
    updated_at: Optional[datetime] = Field(
        default_factory=datetime.now, description="The date and time the issue was last updated")
