from pydantic import BaseModel, computed_field, field_validator, model_validator
from typing import List, Optional
from datetime import date, datetime
import re

class TraineeBase(BaseModel):
    name: str
    phone: str
    goal: str
    subscription_end: date

# Создание trainee
class CreateTrainee(TraineeBase):
    photo_path: Optional[str] = None 
    @field_validator("name")
    @classmethod
    def validate_name(cls, value: str) -> str:
        if len(value) < 2:
            raise ValueError("Имя должно содержать минимум 2 символа")
        return value
    
    @field_validator("phone")
    @classmethod
    def validate_phone(cls, value: str) -> str:
        cleaned_phone = re.sub(r'[^\d]+', '', value)
        
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

class TraineeResponse(TraineeBase):
    id: int
    next_training: Optional[datetime] = None
    photo_path: Optional[str] = None

    @computed_field
    @property
    def photo_url(self) -> Optional[str]:
        if self.photo_path:
            return f"http://localhost:8000/uploads/{self.photo_path}"
        return None

# для отображения списком 
class TraineesResponse(BaseModel):
    id: int
    name: str
    next_training: Optional[datetime] = None

# изменение конкретного trainee
class UpdateTrainee(TraineeBase):
    name: Optional[str] = None
    phone: Optional[str] = None
    goal: Optional[str] = None
    subscription_end: Optional[date] = None

    @field_validator("phone")
    @classmethod
    def validate_phone(cls, value: str) -> str:
        cleaned_phone = re.sub(r'[^\d]+', '', value)
        
        if not cleaned_phone.isdigit():
            raise ValueError("Номер телефона должен содержать только цифры")
        if len(cleaned_phone) < 10:
            raise ValueError("Номер телефона слишком короткий")
        return cleaned_phone

# Удаление одного trainee
class DeleteTraineeResponse(BaseModel):
    success: bool
    message: str
    deleted_trainee_id: int
