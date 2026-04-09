from enum import Enum
from pydantic import BaseModel
from typing import Optional
from sqlmodel import Field, SQLModel


class IssueStatus(str, Enum):
    open = "open"
    closed = "closed"
    in_progress = "in_progress"


class IssuePriority(str, Enum):
    low = "low"
    medium = "medium"
    high = "high"


class IssueBase(SQLModel):
    title: str = Field(min_length=3, max_length=100,
                       description="The title of the issue")
    description: str = Field(
        min_length=5, max_length=1000, description="The description of the issue")
    priority: IssuePriority = Field(
        default=IssuePriority.medium, description="The priority of the issue")
    status: IssueStatus = Field(
        default=IssueStatus.open, description="The status of the issue")


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
