import pytest
from fastapi.testclient import TestClient


class TestAuthSignup:
    
    def test_signup_success(self, client, test_user_data, db):
        """Успешная регистрация"""
        response = client.post("/auth/signup", json=test_user_data)
        
        assert response.status_code == 201
        data = response.json()
        assert data["email"] == test_user_data["email"]
        assert data["username"] == test_user_data["username"]
        assert "id" in data
        assert "created_at" in data
    
    def test_signup_duplicate_email(self, client, test_user_data, registered_user):
        """Регистрация с существующим email"""
        response = client.post("/auth/signup", json=test_user_data)
        
        assert response.status_code == 400
        assert "email" in response.json()["detail"].lower()
    
    def test_signup_duplicate_username(self, client, test_user_data, registered_user):
        """Регистрация с существующим username"""
        data = test_user_data.copy()
        data["email"] = "another@example.com"
        
        response = client.post("/auth/signup", json=data)
        
        assert response.status_code == 400
        assert "именем" in response.json()["detail"].lower()
    
    def test_signup_weak_password(self, client, db):
        """Слабый пароль"""
        weak_user = {
            "email": "weak@example.com",
            "username": "weakuser",
            "password": "123",  # слишком короткий
            "confirm_password": "123"
        }
        
        response = client.post("/auth/signup", json=weak_user)
        
        assert response.status_code == 422  # Validation error


class TestAuthLogin:
    """Тесты входа"""
    
    def test_login_success(self, client, test_user_data, registered_user):
        """Успешный вход"""
        response = client.post(
            "/auth/login",
            json={
                "identifier": test_user_data["email"],
                "password": test_user_data["password"]
            }
        )
        
        assert response.status_code == 200
        data = response.json()
        assert "access_token" in data
        assert "refresh_token" in data
        assert data["token_type"] == "bearer"
        assert data["user_id"] == registered_user.id
        assert data["role"] == registered_user.role
    
    def test_login_wrong_password(self, client, test_user_data, registered_user):
        """Неверный пароль"""
        response = client.post(
            "/auth/login",
            json={
                "identifier": test_user_data["email"],
                "password": "wrongpassword"
            }
        )
        
        assert response.status_code == 401
    
    def test_login_nonexistent_user(self, client):
        """Пользователь не существует"""
        response = client.post(
            "/auth/login",
            json={
                "identifier": "nonexistent@example.com",
                "password": "password123"
            }
        )
        
        assert response.status_code == 401
    
    def test_login_with_username(self, client, test_user_data, registered_user):
        """Вход по username"""
        response = client.post(
            "/auth/login",
            json={
                "identifier": test_user_data["username"],
                "password": test_user_data["password"]
            }
        )
        
        assert response.status_code == 200


class TestAuthMe:
    """Тесты получения текущего пользователя"""
    
    def test_get_me_success(self, client, auth_headers, registered_user):
        """Получение своих данных"""
        response = client.get("/auth/me", headers=auth_headers)
        
        assert response.status_code == 200
        data = response.json()
        assert data["email"] == registered_user.email
        assert data["username"] == registered_user.username
        assert data["id"] == registered_user.id
    
    def test_get_me_unauthorized(self, client):
        """Без токена"""
        response = client.get("/auth/me")
        
        assert response.status_code == 401
    
    def test_get_me_invalid_token(self, client):
        """Неверный токен"""
        headers = {"Authorization": "Bearer invalid_token"}
        response = client.get("/auth/me", headers=headers)
        
        assert response.status_code == 401