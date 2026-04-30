from datetime import datetime, timezone

from pydantic import BaseModel, EmailStr
from sqlalchemy import Column, DateTime
from sqlmodel import Field, SQLModel


class User(SQLModel, table=True):
    id: int | None = Field(default=None, primary_key=True)
    email: str = Field(unique=True, index=True)
    hashed_pass: str
    username: str = Field(unique=True, index=True)
    name: str | None = Field(default=None, max_length=100)
    created_at: datetime = Field(
        default_factory=lambda: datetime.now(timezone.utc),
        sa_column=Column(DateTime(timezone=True), nullable=False),
    )


class UserResponse(BaseModel):
    id: int
    email: EmailStr
    username: str
    name: str | None = None
    created_at: datetime = Field(
        default_factory=lambda: datetime.now(timezone.utc))


class UserUpdate(BaseModel):
    name: str | None = None
    username: str | None = None
