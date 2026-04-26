from datetime import datetime, timezone
from typing import Optional


from sqlmodel import Column, DateTime, SQLModel, Field


class ProjectBase(SQLModel):
    name: str = Field(min_length=3, max_length=100,
                      description="The name of the project")
    description: str | None = Field(
        default=None, max_length=1000, description="The description of the project")


class Project(ProjectBase, table=True):
    id: int | None = Field(default=None, primary_key=True)
    owner_id: int = Field(foreign_key="user.id")
    created_at: datetime = Field(
        default_factory=lambda: datetime.now(timezone.utc),
        sa_column=Column(DateTime(timezone=True), nullable=False)
    )


class ProjectCreate(ProjectBase):
    pass


class ProjectUpdate(SQLModel):
    name: Optional[str] = Field(default=None, min_length=3, max_length=100)
    description: Optional[str] = Field(default=None, max_length=1000)
