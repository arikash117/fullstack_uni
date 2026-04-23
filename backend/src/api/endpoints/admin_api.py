from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session
from src.crud.admin import (
    delete_user,
    get_all_users_for_admin,
    get_user_by_id,
    update_user_role,
)
from src.database.db import get_db
from src.models.user import User
from src.core.auth import get_current_admin
from src.schemas.admin import (
    UserResponse,
    UsersResponse,
    DeleteUserResponse,
    RoleUpdateResponse,
    RoleUpdateRequest,
)
 
admin_router = APIRouter(prefix="/admin", tags=["admin"])

# список всех пользователей
@admin_router.get("/users", response_model=List[UsersResponse])
def get_all_users(
    username: Optional[str] = Query(None),
    role: Optional[str] = Query(None),
    skip: int = Query(0, ge=0),
    limit: int = Query(10, ge=1, le=1000),
    db: Session = Depends(get_db),
    admin: User = Depends(get_current_admin),
):
    return get_all_users_for_admin(db=db, skip=skip, limit=limit, username=username, role=role)

# GET /admin/users/{user_id} -> по ID конкретный пользователь
@admin_router.get("/users/{user_id}", response_model=UserResponse)
def get_user(
    user_id: int,
    db: Session = Depends(get_db),
    admin: User = Depends(get_current_admin),
):
    try:
        return get_user_by_id(db, user_id=user_id)
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(e))

# PUTCH изменение роли пользователя
@admin_router.patch("/users/{user_id}/role", response_model=RoleUpdateResponse)
def change_user_role(
    user_id: int,
    role_data: RoleUpdateRequest,
    db: Session = Depends(get_db),
    admin: User = Depends(get_current_admin),
):
    try:
        result = update_user_role(
            db=db,
            user_id=user_id,
            new_role=role_data.role,
            admin_id=admin.id
        )
        return result
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))

# DELETE /admin/users/{user_id} -> удалить
@admin_router.delete("/users/{user_id}", response_model=DeleteUserResponse)
def delete(
    user_id: int,
    db: Session = Depends(get_db),
    admin: User = Depends(get_current_admin),
):
    
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Пользователь не найден")

    if admin.id == user_id:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Нельзя удалить самого себя")
    
    try:
        return delete_user(db, user_id, admin.id)
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))
