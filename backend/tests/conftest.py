import pytest
import os
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool
from fastapi.testclient import TestClient
from datetime import datetime, timezone

# Импорты из твоего приложения
from src.main import app
from src.database.db import Base
from src.database.db import get_db
from src.models.user import User
from src.models.trainee import Trainee
from src.models.workout import Workout
from src.models.refresh_token import RefreshToken
from src.core.security import get_password_hash, create_access_token, create_refresh_token

# ===== БАЗА ДАННЫХ =====
SQLALCHEMY_DATABASE_URL = os.getenv("DATABASE_TEST_URL", "sqlite:///:memory:")

engine = create_engine(
    SQLALCHEMY_DATABASE_URL,
    connect_args={"check_same_thread": False} if "sqlite" in SQLALCHEMY_DATABASE_URL else {},
    poolclass=StaticPool if "sqlite" in SQLALCHEMY_DATABASE_URL else None,
)

TestingSessionLocal = sessionmaker(
    autocommit=False,
    autoflush=False,
    bind=engine,
    expire_on_commit=False,
)


@pytest.fixture(scope="session", autouse=True)
def setup_test_database():
    """Создаём все таблицы перед тестами"""
    Base.metadata.create_all(bind=engine)
    yield
    Base.metadata.drop_all(bind=engine)


@pytest.fixture(scope="function")
def db():
    """Фикстура сессии БД - каждый тест получает чистую БД"""
    connection = engine.connect()
    transaction = connection.begin()
    
    db_session = TestingSessionLocal(bind=connection)
    
    try:
        yield db_session
    finally:
        db_session.close()
        transaction.rollback()
        connection.close()


@pytest.fixture(scope="function")
def client(db):
    """TestClient с подменой БД"""
    def override_get_db():
        try:
            yield db
        finally:
            pass
    
    app.dependency_overrides[get_db] = override_get_db
    
    with TestClient(app) as test_client:
        yield test_client
    
    app.dependency_overrides.clear()


# ===== ФИКСТУРЫ ДЛЯ AUTH =====
@pytest.fixture
def test_user_data():
    """Данные тестового пользователя"""
    return {
        "email": "test@example.com",
        "username": "testuser",
        "password": "Test123!",
        "confirm_password": "Test123!"
    }


@pytest.fixture
def test_admin_data():
    """Данные тестового админа"""
    return {
        "email": "admin@example.com",
        "username": "adminuser",
        "password": "Admin123!",
        "confirm_password": "Admin123!",
        "role": "admin"
    }


@pytest.fixture
def registered_user(client, test_user_data, db):
    """Зарегистрированный пользователь в БД"""
    from src.crud.user import create_user
    
    user = create_user(
        db=db,
        email=test_user_data["email"],
        username=test_user_data["username"],
        password=test_user_data["password"]
    )
    db.commit()
    db.refresh(user)
    
    return user


@pytest.fixture
def auth_tokens(client, test_user_data, registered_user):
    """Получить токены для авторизованного пользователя"""
    login_response = client.post(
        "/auth/login",
        json={
            "identifier": test_user_data["email"],
            "password": test_user_data["password"]
        }
    )
    
    tokens = login_response.json()
    return tokens


@pytest.fixture
def admin_user(client, test_admin_data, db):
    """Создать админа"""
    from src.crud.user import create_user
    
    user = create_user(
        db=db,
        email=test_admin_data["email"],
        username=test_admin_data["username"],
        password=test_admin_data["password"]
    )
    # Устанавливаем роль admin напрямую
    user.role = "admin"
    db.commit()
    db.refresh(user)
    
    return user


@pytest.fixture
def admin_tokens(client, test_admin_data, admin_user):
    """Токены админа"""
    login_response = client.post(
        "/auth/login",
        json={
            "identifier": test_admin_data["email"],
            "password": test_admin_data["password"]
        }
    )
    return login_response.json()


# ===== ФИКСТУРЫ ДЛЯ TRAINEE =====
@pytest.fixture
def trainee_data():
    """Данные для создания trainee"""
    return {
        "name": "Иван Иванов",
        "phone": "79991234567",
        "goal": "Похудение",
        "subscription_end": "2026-12-31"
    }


@pytest.fixture
def created_trainee(client, db, trainee_data, auth_tokens):
    """Созданный trainee"""
    headers = {"Authorization": f"Bearer {auth_tokens['access_token']}"}
    
    response = client.post("/trainees/", json=trainee_data, headers=headers)
    trainee = response.json()
    
    return trainee


# ===== ФИКСТУРЫ ДЛЯ WORKOUT =====
@pytest.fixture
def workout_data():
    """Данные для создания workout"""
    return {
        "date": "2026-05-01",
        "time": "10:00",
        "name": "Тренировка ног",
        "type": "Силовая",
        "trainee_id": 1  # будет заменено в тесте
    }


# ===== ВСПОМОГАТЕЛЬНЫЕ ФУНКЦИИ =====
@pytest.fixture
def auth_headers(auth_tokens):
    """Заголовки с токеном"""
    return {"Authorization": f"Bearer {auth_tokens['access_token']}"}


@pytest.fixture
def admin_auth_headers(admin_tokens):
    """Заголовки с токеном админа"""
    return {"Authorization": f"Bearer {admin_tokens['access_token']}"}


def pytest_configure():
    """Настройка pytest"""
    pytest.test_user_email = "test@example.com"
    pytest.test_password = "Test123!"