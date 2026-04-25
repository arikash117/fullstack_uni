import pytest
import httpx
from datetime import datetime
from unittest.mock import Mock, patch, AsyncMock
from io import BytesIO
from src.services.weather_service import WeatherService
from src.core.minio_client import MinioClient
from src.models.workout import Workout

class TestWeatherService:
    """Unit-тесты для Weather Service"""
    
    @pytest.mark.asyncio
    async def test_get_weather_success(self):
        """Получение погоды — успех"""
        
        mock_response_data = {
            "name": "Moscow",
            "main": {"temp": 25.5, "feels_like": 23.0, "humidity": 60},
            "weather": [{"description": "ясно", "icon": "01d"}],
            "wind": {"speed": 3.5}
        }
        
        # Мокаем httpx.AsyncClient и его метод get
        mock_response = Mock()
        mock_response.json.return_value = mock_response_data
        mock_response.raise_for_status = Mock()
        
        # Создаём мок для async with httpx.AsyncClient() as client:
        mock_client = AsyncMock()
        mock_client.get.return_value = mock_response
        mock_client.__aenter__ = AsyncMock(return_value=mock_client)
        mock_client.__aexit__ = AsyncMock(return_value=None)
        
        with patch('src.services.weather_service.httpx.AsyncClient', return_value=mock_client):
            # Мокаем os.getenv чтобы не зависеть от реального API ключа
            with patch('src.services.weather_service.os.getenv', return_value="fake_api_key"):
                service = WeatherService()
                result = await service.get_weather("Moscow")
                
                # Проверяем результат нормализации
                assert result["city"] == "Moscow"
                assert result["temperature"] == 26  # round(25.5)
                assert result["description"] == "ясно"
                assert result["humidity"] == 60
                
                # Проверяем что httpx был вызван правильно
                mock_client.get.assert_called_once()
                call_args = mock_client.get.call_args
                assert "Moscow" in call_args[1]["params"]["q"]
    
    @pytest.mark.asyncio
    async def test_get_weather_api_error(self):
        """Ошибка API — HTTP 404"""
        
        # Мокаем ответ с ошибкой
        mock_response = Mock()
        mock_response.raise_for_status.side_effect = Exception("404 Not Found")
        
        mock_client = AsyncMock()
        mock_client.get.return_value = mock_response
        mock_client.__aenter__ = AsyncMock(return_value=mock_client)
        mock_client.__aexit__ = AsyncMock(return_value=None)
        
        with patch('src.services.weather_service.httpx.AsyncClient', return_value=mock_client):
            with patch('src.services.weather_service.os.getenv', return_value="fake_key"):
                service = WeatherService()
                
                # Ожидаем исключение
                with pytest.raises(Exception, match="404|Ошибка"):
                    await service.get_weather("InvalidCity")
    
    @pytest.mark.asyncio
    async def test_get_weather_timeout(self):
        """Таймаут запроса"""
        
        mock_client = AsyncMock()
        mock_client.get.side_effect = httpx.TimeoutException("Timeout")
        mock_client.__aenter__ = AsyncMock(return_value=mock_client)
        mock_client.__aexit__ = AsyncMock(return_value=None)
        
        with patch('src.services.weather_service.httpx.AsyncClient', return_value=mock_client):
            with patch('src.services.weather_service.os.getenv', return_value="fake_key"):
                service = WeatherService()
                
                with pytest.raises(Exception, match="время ожидания|Timeout"):
                    await service.get_weather("Moscow")
    
    def test_normalize_response(self):
        """Тест вспомогательного метода (синхронный)"""
        
        service = WeatherService()
        
        raw_data = {
            "name": "Saint Petersburg",
            "main": {"temp": 18.7, "feels_like": 17.2, "humidity": 75},
            "weather": [{"description": "облачно", "icon": "03d"}],
            "wind": {"speed": 4.2}
        }
        
        result = service._normalize_response(raw_data)
        
        assert result["city"] == "Saint Petersburg"
        assert result["temperature"] == 19  # round(18.7)
        assert result["feels_like"] == 17
        assert result["description"] == "облачно"
        assert result["humidity"] == 75
        assert result["wind_speed"] == 4.2
        assert "updated_at" in result  # datetime iso format


class TestMinioService:
    """Unit-тесты для MinIO клиента"""
    
    def test_upload_file_success(self):
        """Загрузка файла в MinIO"""
        
        
        mock_client = Mock()
        mock_client.upload_fileobj.return_value = None
        
        with patch('src.core.minio_client.boto3.client', return_value=mock_client):
            minio = MinioClient()
            
            file_stream = BytesIO(b"fake image data")
            result = minio.upload_file(file_stream, "trainees/test.jpg", "image/jpeg")
            
            assert result == "trainees/test.jpg"
            mock_client.upload_fileobj.assert_called_once()
    
    def test_get_public_url(self):
        """Генерация публичного URL"""
        
        with patch('src.core.minio_client.os.getenv') as mock_env:
            mock_env.side_effect = lambda key, default=None: {
                "MINIO_ENDPOINT": "localhost",
                "MINIO_PORT": "9000",
                "MINIO_BUCKET": "trainee-photos",
                "MINIO_PUBLIC_URL": "http://localhost:9000"
            }.get(key, default)
            
            minio = MinioClient()
            url = minio.get_public_url("trainees/photo.jpg")
            
            assert "photo.jpg" in url
            assert "localhost:9000" in url
    
    def test_delete_file_success(self):
        """Удаление файла"""
        
        mock_client = Mock()
        mock_client.delete_object.return_value = None
        
        with patch('src.core.minio_client.boto3.client', return_value=mock_client):
            minio = MinioClient()
            minio.delete_file("trainees/old.jpg")
            
            mock_client.delete_object.assert_called_once()


class TestNextTrainingCalculation:
    """Unit-тесты для расчёта следующей тренировки"""
    
    def test_next_training_found(self):
        """Следующая тренировка найдена"""
        
        workout1 = Mock(spec=Workout)
        workout1.date = datetime(2026, 4, 20, 10, 0)  # прошлое
        
        workout2 = Mock(spec=Workout)
        workout2.date = datetime(2026, 5, 1, 10, 0)   # будущее
        
        workouts = [workout1, workout2]
        
        future_workouts = [w for w in workouts if w.date > datetime.now()]
        next_training = min(future_workouts, key=lambda x: x.date) if future_workouts else None
        
        assert next_training == workout2
    
    def test_no_future_trainings(self):
        """Нет будущих тренировок"""
        
        workout = Mock(spec=Workout)
        workout.date = datetime(2025, 1, 1, 10, 0)
        
        workouts = [workout]
        
        future_workouts = [w for w in workouts if w.date > datetime.now()]
        next_training = min(future_workouts, key=lambda x: x.date) if future_workouts else None
        
        assert next_training is None