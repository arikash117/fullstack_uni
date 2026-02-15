from sqlalchemy import func
from sqlalchemy.orm import Session
from typing import List, Optional
from src.models.trainee import Trainee
from src.models.user import User
from src.schemas.admin import (
    UserResponse,
    UsersResponse,
    DeleteUserResponse,
    RoleUpdateResponse,
)

# список пользователей
def get_all_users_for_admin(
    db: Session,
    skip: int = 0,
    limit: int = 10,
    username: Optional[str] = None,
    role: Optional[str] = None,
) -> List[UsersResponse]:
    query = db.query(User)

    if username:
        query = query.filter(User.username.ilike(f"{username}%"))
    if role:
        query = query.filter(User.role == role)

    users = query.order_by(User.id).offset(skip).limit(limit).all()

    return [
        UsersResponse(
            id=u.id,
            email=u.email,
            username=u.username,
            role=u.role,
        ) for u in users
    ]

# конкретный пользователь
def get_user_by_id(db: Session, user_id: int) -> UserResponse:
    user = db.query(
        User.id,
        User.username,
        User.email,
        User.role,
        User.created_at,
        func.count(Trainee.id).label('trainee_count')
    ).outerjoin(Trainee, Trainee.coach_id == User.id).filter(User.id == user_id).group_by(
        User.id, User.username, User.email, User.role, User.created_at
    ).first()

    if not user:
        raise ValueError("Пользователь не найден")

    return UserResponse(
        id=user.id,
        username=user.username,
        email=user.email,
        role=user.role,
        created_at=user.created_at,
        trainee_count=user.trainee_count or 0
    )

def update_user_role(
    db: Session,
    user_id: int,
    new_role: str,
    admin_id: int
) -> RoleUpdateResponse:
    if user_id == admin_id:
        raise ValueError("Нельзя изменить свою собственную роль")
    
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise ValueError("Пользователь не найден")
    
    if user.role == new_role:
        raise ValueError(f"Пользователь уже имеет роль '{new_role}'")
    
    old_role = user.role
    
    user.role = new_role
    db.commit()
    db.refresh(user)
    
    return RoleUpdateResponse(
        id=user.id,
        success=True,
        message=f"Роль пользователя {user.username} изменена",
        username=user.username,
        old_role=old_role,
        new_role=new_role
    )

# удаление пользователя
def delete_user(db: Session, user_id: int, admin_id: int) -> DeleteUserResponse:
    if user_id == admin_id:
        raise ValueError("Нельзя удалить самого себя")
    
    user = db.query(User).filter(User.id == user_id).first()
    
    if not user:
        raise ValueError("Пользователь не найден")
    
    db.delete(user)
    db.commit()
    
    return DeleteUserResponse(
        success=True,
        message=f"Пользователь {user.username} удалён",
        deleted_user_id=user_id
    )
