from pydantic import BaseModel, EmailStr, field_validator
from datetime import datetime
import re

class RegisterRequest(BaseModel):
    email: EmailStr
    username: str
    password: str
    confirm_password: str

    @field_validator("username")
    @classmethod
    def validate_username(cls, value: str) -> str:
        if len(value) < 3:
            raise ValueError("Имя пользователя должно быть минимум 3 символа")
        if not re.match(r'^[a-zA-Z0-9_]+$', value):
            raise ValueError("Имя пользователя может содержать только буквы, цифры и подчеркивания")
        return value

    @field_validator("password")
    @classmethod
    def validate_password(cls, value: str) -> str:
        if len(value) < 6:
            raise ValueError("Пароль должен содержать минимум 6 символов")
        if len(value) > 72:
            raise ValueError("Пароль не может быть длиннее 72 символов")
        if not re.search(r'[A-Za-z]', value):
            raise ValueError("Пароль должен содержать хотя бы одну букву")
        if not re.search(r'\d', value):
            raise ValueError("Пароль должен содержать хотя бы одну цифру")
        return value
    
    @field_validator("confirm_password")
    @classmethod
    def passwords_match(cls, value: str, info) -> str:
        if "password" in info.data and value != info.data["password"]:
            raise ValueError("Пароли не совпадают")
        return value

class RegisterResponse(BaseModel):
    id: int
    email: str
    username: str
    created_at: datetime
    
    class Config:
        from_attributes = True

class LoginRequest(BaseModel):
    identifier: str
    password: str

class TokenResponse(BaseModel):
    access_token: str
    refresh_token: str
    token_type: str = "bearer"
    expires_in: int
    role: str
    user_id: int

class TokenRefreshRequest(BaseModel):
    refresh_token: str

class LogoutRequest(BaseModel):
    refresh_token: str

class UserResponse(BaseModel):
    id: int
    email: str
    username: str
    role: str
    created_at: datetime
    
    class Config:
        from_attributes = True

class TokenPayload(BaseModel):
    sub: str
    user_id: int
    role: str
    exp: int
    iat: int
    type: str
    jti: str