from pydantic import BaseModel, EmailStr, Field
from datetime import datetime

class UserBase(BaseModel):
    id: int
    username: str

#конкретный пользователь
class UserResponse(UserBase):
    role: str
    created_at: datetime
    email: EmailStr

# для отображения списком 
class UsersResponse(UserBase):
    role: str
    email: EmailStr

# изменение роли пользователя
class RoleUpdateRequest(BaseModel):
    role: str = Field(
        ...,
        pattern="^(admin|user)$",
        description="Новая роль пользователя"
    )

class RoleUpdateResponse(UserBase):
    success: bool
    message: str
    old_role: str
    new_role: str

# удаление юзера
class DeleteUserResponse(BaseModel):
    success: bool
    message: str
    deleted_user_id: int
