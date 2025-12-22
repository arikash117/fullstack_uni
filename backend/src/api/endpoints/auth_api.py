from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.orm import Session
from src.database.db import get_db
from src.schemas.auth import (
    RegisterRequest,
    LoginRequest,
    TokenResponse,
    RegisterResponse,
    UserResponse
)
from src.crud.user import get_user_by_email, create_user
from src.core.security import verify_password, create_access_token, create_refresh_token

auth_router = APIRouter(prefix="/auth")

# Регистрация
@auth_router.post('/signup', response_model=RegisterResponse)
async def signup(
    user_data: RegisterRequest,
    db: Session = Depends(get_db)
):
    # Проверка, существует ли email
    if get_user_by_email(db, user_data.email):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Пользователь с таким email уже существует"
        )
    
    user = create_user(
        db=db,
        email=user_data.email,
        username=user_data.username,
        password=user_data.password
    )
    
    return RegisterResponse(
        id=user.id,
        email=user.email,
        created_at=user.created_at
    )

# Логин
@auth_router.post('/login', response_model=TokenResponse)
async def login(
    form_data: OAuth2PasswordRequestForm = Depends(),  # ← вот это!
    db: Session = Depends(get_db)
):
    user = get_user_by_email(db, form_data.username)  # ← username = email
    if not user or not verify_password(form_data.password, user.password_hash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Неверный email или пароль",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    access_token = create_access_token(user.email)
    refresh_token = create_refresh_token(user.email)
    
    return TokenResponse(
        access_token=access_token,
        refresh_token=refresh_token,
        expires_in=30 * 60
    )
