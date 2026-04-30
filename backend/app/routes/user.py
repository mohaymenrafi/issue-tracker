from fastapi import APIRouter, Depends, HTTPException, status
from sqlmodel import Session, select

from app.models.users import User, UserResponse, UserUpdate
from app.core.auth import get_current_user
from app.database import get_session


router = APIRouter(prefix='/api/v1/users', tags=['users'])


@router.get('/me', status_code=status.HTTP_200_OK, response_model=UserResponse)
def get_me(current_user: User = Depends(get_current_user)) -> UserResponse:
    """Get the current user"""
    return current_user


@router.patch('/me', status_code=status.HTTP_200_OK, response_model=UserResponse)
def update_current_user(payload: UserUpdate, current_user: User = Depends(get_current_user), session: Session = Depends(get_session)) -> UserResponse:
    """Updates current signed in user"""
    updates = payload.model_dump(exclude_unset=True)
    if 'username' in payload:
        existing_user = session.exec(select(User).where(
            User.username == updates["username"])).first()
        if existing_user and existing_user.id != current_user.id:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Username already in use"
            )

    current_user.sqlmodel_update(updates)
    session.add(current_user)
    session.commit()
    session.refresh(current_user)
    return current_user
