from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from datetime import datetime, timezone, timedelta
from src.database.db import get_db
from src.schemas.auth import (
    LoginRequest,
    RegisterRequest,
    TokenRefreshRequest,
    TokenResponse,
    RegisterResponse,
    UserResponse,
    LogoutRequest,
)
from src.crud.user import get_user_by_email_or_username, get_user_by_email, get_user_by_username, create_user
from src.core.security import (
    verify_password,
    create_access_token,
    create_refresh_token,
    verify_refresh_token,
    store_refresh_token,
    get_valid_refresh_token,
    revoke_refresh_token,
    revoke_all_user_tokens,
    hash_token,
)
from src.core.auth import get_current_user
from src.models.user import User
from src.core.config import settings

auth_router = APIRouter(prefix="/auth", tags=["auth"])

@auth_router.post('/signup', response_model=RegisterResponse, status_code=status.HTTP_201_CREATED)
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
        username=user.username,
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
    
    access_token = create_access_token(email=user.email, user_id=user.id, role=user.role)
    refresh_token = create_refresh_token(email=user.email, user_id=user.id)
    
    expires_at = datetime.now(timezone.utc) + timedelta(days=settings.REFRESH_TOKEN_EXPIRE_DAYS)
    store_refresh_token(db, user_id=user.id, token=refresh_token, expires_at=expires_at)
    
    return TokenResponse(
        access_token=access_token,
        refresh_token=refresh_token,
        token_type="bearer",
        expires_in=settings.ACCESS_TOKEN_EXPIRE_MINUTES * 60,
        role=user.role,
        user_id=user.id
    )

@auth_router.post("/refresh", response_model=TokenResponse)
async def refresh_token_endpoint(
    refresh_request: TokenRefreshRequest,
    db: Session = Depends(get_db)
):
    payload = verify_refresh_token(refresh_request.refresh_token)
    if not payload:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Неверный или просроченный refresh token"
        )
    
    email = payload.get("sub")
    user_id = payload.get("user_id")
    
    db_token = get_valid_refresh_token(db, refresh_request.refresh_token)
    if not db_token:
        if email:
            user = get_user_by_email(db, email)
            if user:
                revoke_all_user_tokens(db, user.id)
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Сессия отозвана или токен уже использован"
        )
    
    user = get_user_by_email(db, email)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Пользователь не найден"
        )
    
    revoke_refresh_token(db, refresh_request.refresh_token)

    new_access_token = create_access_token(email=user.email, user_id=user.id, role=user.role)
    new_refresh_token = create_refresh_token(email=user.email, user_id=user.id)

    expires_at = datetime.now(timezone.utc) + timedelta(days=settings.REFRESH_TOKEN_EXPIRE_DAYS)
    store_refresh_token(db, user_id=user.id, token=new_refresh_token, expires_at=expires_at)

    db_token.last_used_at = datetime.now(timezone.utc)
    db.commit()
    
    return TokenResponse(
        access_token=new_access_token,
        refresh_token=new_refresh_token,
        token_type="bearer",
        expires_in=settings.ACCESS_TOKEN_EXPIRE_MINUTES * 60,
        role=user.role,
        user_id=user.id
    )

@auth_router.post("/logout")
async def logout(
    logout_request: LogoutRequest,
    db: Session = Depends(get_db)
):
    payload = verify_refresh_token(logout_request.refresh_token)
    if payload:
        revoke_refresh_token(db, logout_request.refresh_token)
    
    return {"message": "Успешный выход"}

@auth_router.post("/logout/all")
async def logout_all_sessions(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    revoked_count = revoke_all_user_tokens(db, current_user.id)
    return {"message": f"Отозвано сессий: {revoked_count}"}

@auth_router.get("/me", response_model=UserResponse)
async def get_me(current_user: User = Depends(get_current_user)):
    return current_user
