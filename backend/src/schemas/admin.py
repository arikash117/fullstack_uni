from pydantic import BaseModel, EmailStr
from datetime import datetime

class UserBase(BaseModel):
    id: int
    username: str
    email: EmailStr

#конкретный пользователь
class UserResponse(UserBase):
    role: str
    created_at: datetime

# для отображения списком 
class UsersResponse(UserBase):
    role: str

# удаление юзера
class DeleteUserResponse(BaseModel):
    success: bool
    message: str
    deleted_user_id: int
