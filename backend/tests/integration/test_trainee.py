from io import BytesIO
from datetime import date, timedelta
from src.crud.trainee import create_trainee
from src.schemas.trainee import CreateTrainee
from src.models.trainee import Trainee

class TestTraineeCreate:
    
    def test_create_trainee_success(self, client, auth_headers, trainee_data):
        response = client.post("/trainees/", json=trainee_data, headers=auth_headers)
        assert response.status_code == 200
        data = response.json()
        assert data["name"] == trainee_data["name"]
        assert data["phone"] == trainee_data["phone"]
        assert "id" in data
    
    def test_create_trainee_unauthorized(self, client, trainee_data):
        response = client.post("/trainees/", json=trainee_data)
        assert response.status_code == 401
    
    def test_create_trainee_duplicate_phone(self, client, auth_headers, trainee_data, created_trainee):
        response = client.post("/trainees/", json=trainee_data, headers=auth_headers)
        assert response.status_code == 400
        assert "телефона" in response.json()["detail"].lower()
    
    def test_create_trainee_short_name(self, client, auth_headers, trainee_data):
        trainee_data["name"] = "А"
        response = client.post("/trainees/", json=trainee_data, headers=auth_headers)
        assert response.status_code == 422
    
    def test_create_trainee_invalid_phone(self, client, auth_headers, trainee_data):
        trainee_data["phone"] = "abc123"
        response = client.post("/trainees/", json=trainee_data, headers=auth_headers)
        assert response.status_code == 422
    
    def test_create_trainee_past_subscription(self, client, auth_headers, trainee_data):
        trainee_data["subscription_end"] = (date.today() - timedelta(days=1)).isoformat()
        response = client.post("/trainees/", json=trainee_data, headers=auth_headers)
        assert response.status_code == 422
    
    def test_create_trainee_phone_cleaning(self, client, auth_headers, trainee_data):
        trainee_data["phone"] = "+7 (999) 123-45-67"
        response = client.post("/trainees/", json=trainee_data, headers=auth_headers)
        assert response.status_code == 200
        assert response.json()["phone"] == "79991234567"


class TestTraineeGetList:
    
    def test_get_trainees_empty(self, client, auth_headers):
        response = client.get("/trainees/", headers=auth_headers)
        assert response.status_code == 200
        assert response.json() == []
    
    def test_get_trainees_with_data(self, client, auth_headers, created_trainee):
        response = client.get("/trainees/", headers=auth_headers)
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        assert any(t["id"] == created_trainee["id"] for t in data)
    
    def test_get_trainees_filter_by_name(self, client, auth_headers, trainee_data):
        """Фильтрация по имени — создаём данные через API"""
        # Создаём второго trainee с другим именем
        trainee2 = trainee_data.copy()
        trainee2["phone"] = "79991234568"
        trainee2["name"] = "Петр Петров"
        
        client.post("/trainees/", json=trainee_data, headers=auth_headers)  # Иван
        client.post("/trainees/", json=trainee2, headers=auth_headers)      # Петр
        
        # Фильтруем по "Иван"
        response = client.get("/trainees/?name=Иван", headers=auth_headers)
        assert response.status_code == 200
        data = response.json()
        assert all("Иван" in t["name"] for t in data)
        assert not any(t["name"] == "Петр Петров" for t in data)
    
    def test_get_trainees_unauthorized(self, client):
        response = client.get("/trainees/")
        assert response.status_code == 401


class TestTraineeGetOne:
    """Тесты получения конкретного trainee"""
    
    def test_get_trainee_success(self, client, auth_headers, created_trainee):
        trainee_id = created_trainee["id"]
        response = client.get(f"/trainees/{trainee_id}", headers=auth_headers)
        assert response.status_code == 200
        assert response.json()["id"] == trainee_id
    
    def test_get_trainee_not_found(self, client, auth_headers):
        response = client.get("/trainees/9999", headers=auth_headers)
        assert response.status_code == 404


class TestTraineeUpdate:
    """Тесты обновления trainee"""
    
    def test_update_trainee_success(self, client, auth_headers, created_trainee):
        trainee_id = created_trainee["id"]
        update_data = {"name": "Обновлённое Имя", "goal": "Новая цель"}
        
        response = client.patch(f"/trainees/{trainee_id}", json=update_data, headers=auth_headers)
        assert response.status_code == 200
        assert response.json()["name"] == "Обновлённое Имя"
    
    def test_update_trainee_partial(self, client, auth_headers, created_trainee):
        trainee_id = created_trainee["id"]
        response = client.patch(f"/trainees/{trainee_id}", json={"goal": "Только цель"}, headers=auth_headers)
        assert response.status_code == 200
        assert response.json()["goal"] == "Только цель"
        # Проверяем что имя не изменилось
        assert response.json()["name"] == created_trainee["name"]
    
    def test_update_trainee_duplicate_phone(self, client, auth_headers, trainee_data):
        # Создаём двух trainees через API
        resp1 = client.post("/trainees/", json=trainee_data, headers=auth_headers)
        trainee1 = resp1.json()
        
        trainee2 = trainee_data.copy()
        trainee2["phone"] = "79995556677"
        resp2 = client.post("/trainees/", json=trainee2, headers=auth_headers)
        trainee2 = resp2.json()
        
        # Пытаемся обновить телефон первого на телефон второго
        response = client.patch(
            f"/trainees/{trainee1['id']}",
            json={"phone": trainee2["phone"]},
            headers=auth_headers
        )
        assert response.status_code == 400
        assert "телефона" in response.json()["detail"].lower()


class TestTraineeDelete:
    """Тесты удаления trainee"""
    
    def test_delete_trainee_success(self, client, auth_headers, created_trainee):
        trainee_id = created_trainee["id"]
        response = client.delete(f"/trainees/{trainee_id}", headers=auth_headers)
        assert response.status_code == 200
        assert response.json()["success"] is True
        
        # Проверяем что удалён
        response = client.get(f"/trainees/{trainee_id}", headers=auth_headers)
        assert response.status_code == 404
    
    def test_delete_trainee_not_found(self, client, auth_headers):
        response = client.delete("/trainees/9999", headers=auth_headers)
        assert response.status_code == 404

# тесты для работы с фото trainee
class TestTraineePhoto:
    """Тесты загрузки и получения фото (с моком MinIO)"""
    
    def test_upload_photo_success(self, client, auth_headers, created_trainee, mock_minio):
        """✅ Успешная загрузка фото"""
        trainee_id = created_trainee["id"]
        
        # Создаём фейковый файл в памяти
        file_content = b"fake image data"
        files = {
            "file": ("test.jpg", BytesIO(file_content), "image/jpeg")
        }
        
        response = client.post(
            f"/trainees/{trainee_id}/photo",
            files=files,
            headers=auth_headers
        )
        
        # Проверяем ответ API
        assert response.status_code == 200
        data = response.json()
        assert data["photo_path"] is not None
        assert "trainees/" in data["photo_path"]
        
        # Проверяем что MinIO методы БЫЛИ вызваны
        mock_minio.upload_file.assert_called_once()
        
        # Проверяем аргументы вызова (опционально, для детальной проверки)
        call_args = mock_minio.upload_file.call_args
        assert call_args[0][1].startswith("trainees/")  # object_name
        assert call_args[1]["content_type"] == "image/jpeg"
    
    def test_upload_photo_wrong_content_type(self, client, auth_headers, created_trainee, mock_minio):
        files = {
            "file": ("doc.txt", BytesIO(b"not an image"), "text/plain")
        }
        
        response = client.post(
            f"/trainees/{created_trainee['id']}/photo",
            files=files,
            headers=auth_headers
        )
        
        assert response.status_code == 400
        assert "изображения" in response.json()["detail"].lower()
        
        # MinIO не должен был вызываться
        mock_minio.upload_file.assert_not_called()
    
    def test_upload_photo_large_file(self, client, auth_headers, created_trainee, mock_minio):
        # Создаём "большой" файл (1МБ фейковых данных)
        large_content = b"x" * (1024 * 1024)
        files = {
            "file": ("large.jpg", BytesIO(large_content), "image/jpeg")
        }
        
        response = client.post(
            f"/trainees/{created_trainee['id']}/photo",
            files=files,
            headers=auth_headers
        )
        
        # Если в коде нет лимита на размер — должно пройти
        # Если есть — проверяем соответствующий статус
        assert response.status_code in [200, 413]  # 413 = Payload Too Large
    
    def test_get_photo_url_success(self, client, auth_headers, db, registered_user, mock_minio):

        
        # Создаём trainee с photo_path
        trainee = create_trainee(
            db=db,
            trainee_data=CreateTrainee(
                name="Фото Трейни",
                phone="79991112233",
                goal="Тест",
                subscription_end="2026-12-31",
                photo_path="trainees/mock-photo.jpg"  # ← задаём путь
            ),
            coach_id=registered_user.id
        )
        db.commit()
        
        response = client.get(
            f"/trainees/{trainee.id}/photo-url",
            headers=auth_headers
        )
        
        assert response.status_code == 200
        data = response.json()
        assert "photo_url" in data
        assert "mock-photo.jpg" in data["photo_url"]
        
        # Проверяем что get_public_url был вызван с правильным аргументом
        mock_minio.get_public_url.assert_called_once_with("trainees/mock-photo.jpg")
    
    def test_get_photo_url_not_found(self, client, auth_headers, created_trainee, mock_minio):
        """❌ Запрос URL для trainee без фото"""
        # created_trainee создан без photo_path
        response = client.get(
            f"/trainees/{created_trainee['id']}/photo-url",
            headers=auth_headers
        )
        
        assert response.status_code == 404
        assert "Фото не найдено" in response.json()["detail"]
        
        # MinIO не должен вызываться
        mock_minio.get_public_url.assert_not_called()
    
    def test_update_trainee_with_photo_replacement(self, client, auth_headers, created_trainee, mock_minio, db):
        trainee_id = created_trainee["id"]
        
        # Сначала задаём старое фото напрямую в БД (симуляция)
        trainee = db.query(Trainee).filter(Trainee.id == trainee_id).first()
        trainee.photo_path = "trainees/old-photo.jpg"
        db.commit()
        
        # Загружаем новое фото
        new_file = BytesIO(b"new image data")
        files = {"file": ("new.jpg", new_file, "image/jpeg")}
        
        response = client.post(
            f"/trainees/{trainee_id}/photo",
            files=files,
            headers=auth_headers
        )
        
        assert response.status_code == 200
        
        # Проверяем что:
        # 1. Было удалено старое фото
        mock_minio.delete_file.assert_called_once_with("trainees/old-photo.jpg")
        
        # 2. Было загружено новое
        assert mock_minio.upload_file.call_count == 1        