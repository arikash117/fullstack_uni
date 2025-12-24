from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session
from src.crud.admin import (
    delete_user_for_admin,
    get_all_trainees_for_admin,
    get_all_users_for_admin,
    get_user_for_admin,
)
from src.database.db import get_db
from src.models.user import User
from src.core.auth import get_current_admin
from src.schemas.admin import AdminDeleteUserResponse, AdminTraineeResponse, AdminUserResponse
 

admin_router = APIRouter(prefix="/admin", tags=["admin"])

@admin_router.get("/trainees", response_model=List[AdminTraineeResponse])
def get_all_trainees(
    name: Optional[str] = Query(None),
    db: Session = Depends(get_db),
    admin: User = Depends(get_current_admin),
):
    return get_all_trainees_for_admin(db=db, name=name)

@admin_router.get("/users", response_model=List[AdminUserResponse])
def get_all_users(
    username: Optional[str] = Query(None),
    role: Optional[str] = Query(None),
    db: Session = Depends(get_db),
    admin: User = Depends(get_current_admin),
):
    return get_all_users_for_admin(db=db, username=username, role=role)

# GET /admin/users/{user_id} → по ID
@admin_router.get("/users/{user_id}", response_model=AdminUserResponse)
def get_user_by_id(
    user_id: int,
    db: Session = Depends(get_db),
    admin: User = Depends(get_current_admin),
):
    try:
        return get_user_for_admin(db, user_id=user_id)
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))

# DELETE /admin/users/{user_id} → удалить
@admin_router.delete("/users/{user_id}", response_model=AdminDeleteUserResponse)
def delete_user(
    user_id: int,
    db: Session = Depends(get_db),
    admin: User = Depends(get_current_admin),
):
    if admin.id == user_id:
        raise HTTPException(status_code=400, detail="Нельзя удалить самого себя")
    
    try:
        return delete_user_for_admin(db, user_id)
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
