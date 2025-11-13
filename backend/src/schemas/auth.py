from pydantic import BaseModel, EmailStr, ConfigDict , field_validator
from datetime import datetime
import re

class User(BaseModel):
    email: EmailStr

class UserResponse(User):
    id: int
    username: str
    created_at: datetime

# LOGIN
class LoginRequest(BaseModel):
    password: str

# REGISTER
class RegisterRequest(User):
    username: str
    password: str
    confirm_password: str

    @field_validator("username")
    @classmethod
    def validate_username(cls, value) -> str:
        if len(value) < 3:
            raise ValueError("Имя пользователя должно быть минимум 3 символа")
        if not re.match(r'^[a-zA-Z0-9_]+$', value):
            raise ValueError("Имя пользователя может содержать только буквы, цифры и подчеркивания")
        return value

    @field_validator("password")
    @classmethod
    def validate_pass(cls, value) -> str:
        if value is None:
            raise ValueError("Пароль не может быть пустым")
        
        if len(value) < 6:
            raise ValueError("Пароль должен содержать минимум 6 символов")
        
        if not re.search(r'[A-Za-z]', value):
            raise ValueError("Пароль должен содержать хотя бы одну букву")
        
        if not re.search(r'\d', value):
            raise ValueError("Пароль должен содержать хотя бы одну цифру")
        
        return value
    
    @field_validator("confirm_password")
    @classmethod
    def pass_match(cls, value, info) -> str:
        if "password" in info.data and value != info.data["password"]:
            raise ValueError("Пароли не совпадают")
        return value


class RegisterResponse(User):
    id: int
    created_at: datetime


#TOKENS
class TokenResponse(BaseModel):
    access_token: str
    refresh_token: str
    token_type: str = "bearer"
    expires_in: int # in seconds

class TokenRefreshRequest(BaseModel):
    refresh_token: str

# JWT payload схема
class TokenPayload(BaseModel):
    sub: str  # (email)
    exp: int
    iat: int
    type: str # access/refresh