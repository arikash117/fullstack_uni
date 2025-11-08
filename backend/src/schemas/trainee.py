from pydantic import BaseModel, field_validator
from typing import List, Optional
from datetime import date, datetime
import re

class TraineeResponse(BaseModel):
    id: int
    name: str
    phone: str
    goal: str
    subscription_end: date
    next_training: datetime

class CreateTrainee(BaseModel):
    name: str
    phone: str
    goal: str
    subscription_end: date
    next_training: datetime

    @field_validator("name")
    @classmethod
    def validate_name(cls, value: str) -> str:
        if len(value) < 2:
            raise ValueError("Имя должно содержать минимум 2 символа")
        return value
    
    @field_validator("phone")
    @classmethod
    def validate_phone(cls, value: str) -> str:
        cleaned_phone = re.sub(r'[\s\-\(\)]+', '', value)
        if not cleaned_phone.isdigit():
            raise ValueError("Номер телефона должен содержать только цифры")
        if len(cleaned_phone) < 10:
            raise ValueError("Номер телефона слишком короткий")
        return cleaned_phone

    @field_validator("subscription_end")
    @classmethod
    def validate_subscription_end(cls, value: date) -> date:
        if value < date.today():
            raise ValueError("Дата окончания подписки не может быть в прошлом")
        return value

class SubordinateUpdate(BaseModel):
    phone: Optional[str] = None
    next_training: Optional[datetime] = None

    @field_validator("phone")
    @classmethod
    def validate_phone(cls, value: str) -> str:
        cleaned_phone = re.sub(r'[\s\-\(\)]+', '', value)
        if not cleaned_phone.isdigit():
            raise ValueError("Номер телефона должен содержать только цифры")
        if len(cleaned_phone) < 10:
            raise ValueError("Номер телефона слишком короткий")
        return cleaned_phone
    
    @field_validator("next_training")
    @classmethod
    def validate_next_training(cls, value: date) -> date:
        if value < date.today():
            raise ValueError("Дата следующей тренировки не может быть в прошлом")
        return value

# для отображения списком 
class TraineesResponse(BaseModel):
    id: int
    name: str
    next_training: datetime

class DeleteTrainee(BaseModel):
    trainee_id: int

class DeleteTraineeResponse(BaseModel):
    success: bool
    message: str
    deleted_trainee_id: int
