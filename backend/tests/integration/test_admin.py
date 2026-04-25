class TestAdminUserManagement:
    """Тесты управления пользователями (только для админа)"""
    
    def test_admin_can_view_all_users(self, client, admin_auth_headers):
        """Админ видит список всех пользователей"""
        response = client.get("/admin/users", headers=admin_auth_headers)
        assert response.status_code == 200
        assert isinstance(response.json(), list)
    
    def test_user_cannot_access_admin_endpoint(self, client, auth_headers):
        """Обычный пользователь НЕ может зайти в /admin/*"""
        response = client.get("/admin/users", headers=auth_headers)
        assert response.status_code == 403
    
    def test_admin_can_change_user_role(self, client, admin_auth_headers, registered_user):
        """Админ может изменить роль пользователя"""
        response = client.patch(
            f"/admin/users/{registered_user.id}/role",
            json={"role": "admin"},
            headers=admin_auth_headers
        )
        assert response.status_code == 200
        assert response.json()["new_role"] == "admin"
    
    def test_admin_cannot_change_own_role(self, client, admin_auth_headers, admin_user):
        """Админ НЕ может изменить свою роль"""
        response = client.patch(
            f"/admin/users/{admin_user.id}/role",
            json={"role": "user"},
            headers=admin_auth_headers
        )
        assert response.status_code == 400
        assert "свою" in response.json()["detail"].lower()
    
    def test_admin_can_delete_user(self, client, admin_auth_headers, registered_user):
        """Админ может удалить пользователя"""
        response = client.delete(
            f"/admin/users/{registered_user.id}",
            headers=admin_auth_headers
        )
        assert response.status_code == 200
        assert response.json()["success"] is True
    
    def test_admin_cannot_delete_self(self, client, admin_auth_headers, admin_user):
        """Админ НЕ может удалить себя"""
        response = client.delete(
            f"/admin/users/{admin_user.id}",
            headers=admin_auth_headers
        )
        assert response.status_code == 400
        assert "себя" in response.json()["detail"].lower()


class TestAdminAccessToTrainees:
    """Админ имеет доступ к чужим trainees"""
    
    def test_admin_can_view_other_trainees(self, client, admin_auth_headers, trainee_data, registered_user):
        """Админ может получить список чужих trainees через coach_id"""
        # Сначала создаём trainee обычным пользователем
        client.post("/trainees/", json=trainee_data, headers={"Authorization": f"Bearer {client.post('/auth/login', json={'identifier': 'test@example.com', 'password': 'Test123!'}).json()['access_token']}"})
        
        # Админ запрашивает по coach_id
        response = client.get(f"/trainees/?coach_id={registered_user.id}", headers=admin_auth_headers)
        assert response.status_code == 200
        assert len(response.json()) >= 1
    
    def test_admin_can_delete_any_trainee(self, client, admin_auth_headers, trainee_data, registered_user):
        """Админ может удалить чужого trainee"""
        # Создаём trainee через обычного пользователя
        login_resp = client.post("/auth/login", json={"identifier": "test@example.com", "password": "Test123!"})
        user_token = login_resp.json()["access_token"]
        user_headers = {"Authorization": f"Bearer {user_token}"}
        
        resp = client.post("/trainees/", json=trainee_data, headers=user_headers)
        trainee = resp.json()
        
        # Админ удаляет
        response = client.delete(f"/trainees/{trainee['id']}", headers=admin_auth_headers)
        assert response.status_code == 200