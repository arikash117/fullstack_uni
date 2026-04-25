import pytest
from datetime import datetime
from pydantic import ValidationError

from src.schemas.auth import RegisterRequest, LoginRequest
from src.schemas.trainee import CreateTrainee, UpdateTrainee
from src.schemas.workout import CreateWorkout, UpdateWorkout


class TestAuthSchemas:
    """Unit-тесты валидации схем Auth"""
    
    def test_register_request_valid(self):
        """Валидная регистрация"""
        data = {
            "email": "test@example.com",
            "username": "validuser",
            "password": "Pass123!",
            "confirm_password": "Pass123!"
        }
        
        schema = RegisterRequest(**data)
        
        assert schema.email == "test@example.com"
        assert schema.username == "validuser"
    
    def test_register_request_invalid_email(self):
        """Неверный email"""
        data = {
            "email": "not-an-email",
            "username": "user",
            "password": "Pass123!",
            "confirm_password": "Pass123!"
        }
        
        with pytest.raises(ValidationError) as exc_info:
            RegisterRequest(**data)
        
        assert "email" in str(exc_info.value).lower()
    
    def test_register_request_username_too_short(self):
        """Username короче 3 символов"""
        data = {
            "email": "test@example.com",
            "username": "ab",  # слишком короткий
            "password": "Pass123!",
            "confirm_password": "Pass123!"
        }
        
        with pytest.raises(ValidationError) as exc_info:
            RegisterRequest(**data)
        
        assert "3 символа" in str(exc_info.value)
    
    def test_register_request_password_too_weak(self):
        """Слабый пароль"""
        data = {
            "email": "test@example.com",
            "username": "user",
            "password": "123",  # слишком короткий и простой
            "confirm_password": "123"
        }
        
        with pytest.raises(ValidationError):
            RegisterRequest(**data)
    
    def test_register_request_passwords_dont_match(self):
        """Пароли не совпадают"""
        data = {
            "email": "test@example.com",
            "username": "user",
            "password": "Pass123!",
            "confirm_password": "Different123!"
        }
        
        with pytest.raises(ValidationError) as exc_info:
            RegisterRequest(**data)
        
        assert "совпадают" in str(exc_info.value).lower()
    
    def test_login_request_valid(self):
        """Валидный вход"""
        data = {
            "identifier": "test@example.com",
            "password": "Pass123!"
        }
        
        schema = LoginRequest(**data)
        
        assert schema.identifier == "test@example.com"


class TestTraineeSchemas:
    """Unit-тесты валидации схем Trainee"""
    
    def test_create_trainee_valid(self):
        """Валидное создание trainee"""
        data = {
            "name": "Иван Иванов",
            "phone": "79991234567",
            "goal": "Похудение",
            "subscription_end": "2026-12-31"
        }
        
        schema = CreateTrainee(**data)
        
        assert schema.name == "Иван Иванов"
        assert schema.phone == "79991234567"
    
    def test_create_trainee_name_too_short(self):
        """Имя короче 2 символов"""
        data = {
            "name": "А",
            "phone": "79991234567",
            "goal": "Цель",
            "subscription_end": "2026-12-31"
        }
        
        with pytest.raises(ValidationError):
            CreateTrainee(**data)
    
    def test_create_trainee_invalid_phone(self):
        """Неверный телефон"""
        data = {
            "name": "Иван",
            "phone": "abc123",  # буквы
            "goal": "Цель",
            "subscription_end": "2026-12-31"
        }
        
        with pytest.raises(ValidationError):
            CreateTrainee(**data)
    
    def test_create_trainee_phone_cleaning(self):
        """Телефон очищается"""
        data = {
            "name": "Иван",
            "phone": "+7 (999) 123-45-67",
            "goal": "Цель",
            "subscription_end": "2026-12-31"
        }
        
        schema = CreateTrainee(**data)
        
        assert schema.phone == "79991234567"  # очищенный
    
    def test_create_trainee_past_subscription(self):
        """Дата в прошлом"""
        data = {
            "name": "Иван",
            "phone": "79991234567",
            "goal": "Цель",
            "subscription_end": "2025-01-01"  # в прошлом
        }
        
        with pytest.raises(ValidationError):
            CreateTrainee(**data)
    
    def test_update_trainee_partial(self):
        """Частичное обновление"""
        data = {"name": "Новое Имя"}  # только одно поле
        
        schema = UpdateTrainee(**data)
        
        assert schema.name == "Новое Имя"
        assert schema.phone is None  # не указано


class TestWorkoutSchemas:
    """Unit-тесты валидации схем Workout"""
    
    def test_create_workout_valid(self):
        """Валидное создание тренировки"""
        data = {
            "date": "2026-05-01T10:00:00",
            "name": "Тренировка ног",
            "type": "Силовая"
        }
        
        schema = CreateWorkout(**data)
        
        assert schema.name == "Тренировка ног"
        assert isinstance(schema.date, datetime)
    
    def test_create_workout_invalid_date_format(self):
        """Неверный формат даты"""
        data = {
            "date": "01.05.2026",  # неверный формат
            "name": "Тренировка",
            "type": "Силовая"
        }
        
        with pytest.raises(ValidationError):
            CreateWorkout(**data)
    
    def test_update_workout_partial(self):
        """Частичное обновление"""
        data = {"type": "Кардио"}
        
        schema = UpdateWorkout(**data)
        
        assert schema.type == "Кардио"
        assert schema.date is None
        assert schema.name is None
