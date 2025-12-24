from pydantic import BaseModel
from datetime import date, datetime
from typing import List, Optional

class AdminTraineeResponse(BaseModel):
    id: int
    name: str
    phone: str
    goal: str
    subscription_end: date
    next_training: datetime
    coach_email: str
    coach_username: str

class AdminUserResponse(BaseModel):
    id: int
    email: str
    username: str
    role: str
    created_at: datetime

class AdminDeleteUserResponse(BaseModel):
    success: bool
    message: str
    deleted_user_id: int