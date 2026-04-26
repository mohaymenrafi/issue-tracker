from datetime import datetime, timezone
from enum import Enum
from typing import Optional

from sqlalchemy import Column, DateTime
from sqlmodel import Field, SQLModel


class IssueStatus(str, Enum):
    open = "open"
    in_progress = "in_progress"
    closed = "closed"


class IssuePriority(str, Enum):
    low = "low"
    medium = "medium"
    high = "high"


class IssueBase(SQLModel):
    title: str = Field(min_length=3, max_length=200,
                       description="The title of the issue")
    description: str = Field(
        min_length=5, max_length=1000, description="The description of the issue")
    priority: IssuePriority = Field(
        default=IssuePriority.medium, description="The priority of the issue")
    status: IssueStatus = Field(
        default=IssueStatus.open, description="The status of the issue")


class Issue(IssueBase, table=True):
    id: int | None = Field(default=None, primary_key=True)
    reporter_id: int | None = Field(default=None, foreign_key="user.id")
    assignee_id: int | None = Field(default=None, foreign_key="user.id")
    project_id: int | None = Field(default=None, foreign_key="project.id")
    created_at: datetime = Field(
        default_factory=lambda: datetime.now(timezone.utc),
        description="The date and time the issue was created",
        sa_column=Column(DateTime(timezone=True), nullable=False),
    )
    updated_at: datetime = Field(
        default_factory=lambda: datetime.now(timezone.utc),
        description="The date and time the issue was last updated",
        sa_column=Column(DateTime(timezone=True), nullable=False),
    )


class IssueCreate(IssueBase):
    project_id: int | None = Field(default=None, foreign_key="project.id")
    assignee_id: int | None = Field(default=None, foreign_key="user.id")


class IssueUpdate(SQLModel):
    title: Optional[str] = Field(default=None, min_length=3, max_length=100,
                                 description="The title of the issue")
    description: Optional[str] = Field(
        default=None, min_length=5, max_length=1000)
    priority: Optional[IssuePriority] = None
    status: Optional[IssueStatus] = None
