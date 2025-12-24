from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.orm import Session
from src.database.db import get_db
from src.schemas.auth import (
    LoginRequest,
    RegisterRequest,
    TokenRefreshRequest,
    TokenResponse,
    RegisterResponse,
)
from src.crud.user import get_user_by_email_or_username, get_user_by_email, get_user_by_username, create_user
from src.core.security import verify_password, create_access_token, create_refresh_token, verify_refresh_token

auth_router = APIRouter(prefix="/auth")

@auth_router.post('/signup', response_model=RegisterResponse)
async def signup(
    user_data: RegisterRequest,
    db: Session = Depends(get_db)
):
    if get_user_by_email(db, user_data.email):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Пользователь с таким email уже существует"
        )
    
    if get_user_by_username(db, user_data.username):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Пользователь с таким именем уже существует"
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

@auth_router.post('/login', response_model=TokenResponse)
async def login(
    login_data: LoginRequest,
    db: Session = Depends(get_db)
):
    user = get_user_by_email_or_username(db, login_data.identifier)
    if not user or not verify_password(login_data.password, user.password_hash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Неверный логин/email или пароль",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    access_token = create_access_token(user.email)
    refresh_token = create_refresh_token(user.email)
    
    return TokenResponse(
        access_token=access_token,
        refresh_token=refresh_token,
        expires_in=30 * 60
    )

@auth_router.post("/refresh", response_model=TokenResponse)
async def refresh_token(
    refresh_request: TokenRefreshRequest,
    db: Session = Depends(get_db)
):
    email = verify_refresh_token(refresh_request.refresh_token)
    if not email:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Неверный или просроченный refresh token"
        )
    
    user = get_user_by_email(db, email)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Пользователь не найден"
        )
    
    new_access_token = create_access_token(user.email)
    new_refresh_token = create_refresh_token(user.email)
    
    return TokenResponse(
        access_token=new_access_token,
        refresh_token=new_refresh_token,
        expires_in=30 * 60
    )