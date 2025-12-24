from sqlalchemy.orm import Session, joinedload
from typing import List, Optional
from src.models.trainee import Trainee
from src.models.user import User
from src.schemas.admin import AdminDeleteUserResponse, AdminTraineeResponse, AdminUserResponse 


def get_all_trainees_for_admin(
    db: Session,
    skip: int = 0,
    limit: int = 100,
    name: Optional[str] = None,
) -> List[AdminTraineeResponse]:
    query = db.query(Trainee).options(joinedload(Trainee.coach))

    if name:
        query = query.filter(Trainee.name.ilike(f"{name}%"))
    
    trainees = query.offset(skip).limit(limit).all()

    return [
        AdminTraineeResponse(
            id=t.id,
            name=t.name,
            phone=t.phone,
            goal=t.goal,
            subscription_end=t.subscription_end,
            next_training=t.next_training,
            coach_email=t.coach.email,
            coach_username=t.coach.username,
        ) for t in trainees
    ]

def get_all_users_for_admin(
    db: Session,
    skip: int = 0,
    limit: int = 100,
    username: Optional[str] = None,
    role: Optional[str] = None,
) -> List[AdminUserResponse]:
    query = db.query(User)

    if username:
        query = query.filter(User.username.ilike(f"{username}%"))
    if role:
        query = query.filter(User.role == role)

    users = query.offset(skip).limit(limit).all()

    return [
        AdminUserResponse(
            id=u.id,
            email=u.email,
            username=u.username,
            role=u.role,
            created_at=u.created_at
        ) for u in users
    ]

def get_user_for_admin(
    db: Session,
    user_id: Optional[int] = None,
    username: Optional[str] = None
) -> AdminUserResponse:
    query = db.query(User)
    
    if user_id is not None:
        user = query.filter(User.id == user_id).first()
    elif username is not None:
        user = query.filter(User.username == username).first()
    else:
        raise ValueError("Нужно указать user_id или username")
    
    if not user:
        raise ValueError("Пользователь не найден")
    
    return AdminUserResponse(
        id=user.id,
        email=user.email,
        username=user.username,
        role=user.role,
        created_at=user.created_at
    )

def delete_user_for_admin(db: Session, user_id: int) -> AdminDeleteUserResponse:
    user = db.query(User).filter(User.id == user_id).first()
    
    if not user:
        raise ValueError("Пользователь не найден")
    
    db.delete(user)
    db.commit()
    
    return AdminDeleteUserResponse(
        success=True,
        message=f"Пользователь {user.username} удалён",
        deleted_user_id=user_id
    )
