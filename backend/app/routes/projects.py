from fastapi import APIRouter, Depends, HTTPException, status
from app.models.projects import Project, ProjectCreate, ProjectUpdate
from app.models.users import User
from app.database import get_session
from app.core.auth import get_current_user
from sqlmodel import Session, select

router = APIRouter(prefix="/api/v1/projects", tags=['projects'])


def get_project_or_404(project_id: int, session: Depends(get_session), user: User = Depends(get_current_user)):
    project = session.get(Project, project_id)
    if not project:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Project not found")
    return project


@router.get("", response_model=list[Project])
def get_projects(limit: int = 10, page: int = 1, sort="created_at", user: User = Depends(get_current_user), session: Session = Depends(get_session)):
    """Retrieves all projects"""
    query = select(Project).where(Project.owner_id == user.id)
    if sort:
        query.order_by(Project.created_at.desc())
    query.offset((page - 1) * limit).limit(limit)
    return session.exec(query).all()


@router.post("", response_model=Project, status_code=status.HTTP_201_CREATED)
def create_project(payload: ProjectCreate, user: User = Depends(get_current_user), session: Session = Depends(get_session)):
    """Creates a new project"""
    new_project = Project.model_validate(payload)
    new_project.owner_id = user.id
    session.add(new_project)
    session.commit()
    session.refresh(new_project)
    return new_project


@router.get("/{project_id}", response_model=Project, status_code=status.HTTP_200_OK)
def get_project(project: Project = Depends(get_project_or_404)):
    """Retrieves an project by its ID"""
    return project


@router.patch("/{project_id}", response_model=Project, status_code=status.HTTP_200_OK)
def update_project(payload: ProjectUpdate = Depends, session: Session = Depends(get_session), user: User = Depends(get_current_user), project: Project = Depends(get_project_or_404)):
    """Updates an project by its ID"""
    updates = payload.model_dump(exclude_unset=True)
    if project.owner_id != user.id:
        raise HTTPException(
            status=status.HTTP_403_FORBIDDEN, detail="Only the project owner can update the project"
        )
    project.sqlmodel_update(updates)
    session.add(project)
    session.commit()
    session.refresh(project)
    return project


@router.delete("/{project_id}", status_code=status.HTTP_200_OK)
def delete_project(project: Project = Depends(get_project_or_404), user: User = Depends(get_current_user),  session: Session = Depends(get_session)):
    """Deletes an issue by its ID"""
    if project.owner_id != user.id:
        raise HTTPException(
            status=status.HTTP_403_FORBIDDEN, detail="Only the project owner can delete the project"
        )
    session.delete(project)
    session.commit()
    return {"message": "Project deleted successfully"}
