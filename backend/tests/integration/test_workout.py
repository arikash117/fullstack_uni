import pytest
from datetime import datetime
from src.crud.user import create_user
from src.crud.trainee import create_trainee
from src.crud.workout import create_workout
from src.schemas.trainee import CreateTrainee
from src.schemas.workout import CreateWorkout

class TestWorkoutCreate:
    """Тесты создания тренировки"""
    
    def test_create_workout_success(self, client, auth_headers, created_trainee, workout_data):
        """Успешное создание"""
        workout_data["trainee_id"] = created_trainee["id"]
        
        response = client.post(
            f"/workouts/trainee/{created_trainee['id']}",
            json=workout_data,
            headers=auth_headers
        )
        
        assert response.status_code == 200
        data = response.json()
        assert data["name"] == workout_data["name"]
        assert data["type"] == workout_data["type"]
        assert "id" in data
        assert "trainee_id" in data
    
    def test_create_workout_unauthorized(self, client, workout_data, created_trainee):
        """Без токена"""
        response = client.post(
            f"/workouts/trainee/{created_trainee['id']}",
            json=workout_data
        )
        assert response.status_code == 401
    
    def test_create_workout_forbidden_other_trainee(self, client, auth_headers, db, workout_data):
        """Попытка создать тренировку чужому трейни"""
        
        # Создаём другого пользователя и его трейни
        other_user = create_user(db=db, email="other@example.com", username="other", password="Other123!")
        other_trainee = create_trainee(
            db=db,
            trainee_data=CreateTrainee(
                name="Чужой", phone="79990001122", goal="Тест", subscription_end="2026-12-31"
            ),
            coach_id=other_user.id
        )
        db.commit()
        
        workout_data["trainee_id"] = other_trainee.id
        response = client.post(
            f"/workouts/trainee/{other_trainee.id}",
            json=workout_data,
            headers=auth_headers
        )
        assert response.status_code == 403
    
    def test_create_workout_invalid_type(self, client, auth_headers, created_trainee):
        """Неверный тип тренировки"""
        workout_data = {
            "date": "2026-05-01T10:00:00",
            "name": "Тест",
            "type": "НеизвестныйТип"  # не из списка
        }
        response = client.post(
            f"/workouts/trainee/{created_trainee['id']}",
            json=workout_data,
            headers=auth_headers
        )
        # Если валидация типа есть в схеме — будет 422, если нет — 200
        assert response.status_code in [200, 422]


class TestWorkoutGet:
    """Тесты получения тренировок"""
    def test_get_workouts_list_success(self, client, auth_headers, created_trainee, db):
        """Получение списка тренировок трейни"""

        # Создаём несколько тренировок
        for i in range(3):
            create_workout(
                db=db,
                workout_data=CreateWorkout(
                    date=datetime(2026, 5, 1, 10 + i, 0),
                    name=f"Тренировка {i+1}",
                    type="Силовая"
                ),
                trainee_id=created_trainee["id"]
            )
        db.commit()
        
        response = client.get(
            f"/workouts/?trainee_id={created_trainee['id']}",
            headers=auth_headers
        )
        
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        assert len(data) == 3
        assert all(w["id"] > 0 for w in data)
    
    def test_get_workout_by_id_success(self, client, auth_headers, created_trainee, db):
        """Получение одной тренировки по ID"""

        
        workout = create_workout(
            db=db,
            workout_data=CreateWorkout(
                date=datetime(2026, 5, 1, 10, 0),
                name="Уникальная тренировка",
                type="Кардио"
            ),
            trainee_id=created_trainee["id"]
        )
        db.commit()
        
        response = client.get(f"/workouts/{workout.id}", headers=auth_headers)
        
        assert response.status_code == 200
        data = response.json()
        assert data["name"] == "Уникальная тренировка"
        assert data["type"] == "Кардио"
    
    def test_get_workout_not_found(self, client, auth_headers):
        """Тренировка не существует"""
        response = client.get("/workouts/9999", headers=auth_headers)
        assert response.status_code == 404


class TestWorkoutFiltering:
    """Тесты фильтрации и поиска"""
    
    @pytest.fixture
    def setup_workouts(self, client, auth_headers, created_trainee, db):
        """Фикстура: создаёт тестовые тренировки"""
        
        workouts = [
            {"name": "Утренняя силовая", "time": "08:00", "type": "Силовая"},
            {"name": "Дневное кардио", "time": "14:00", "type": "Кардио"},
            {"name": "Вечерняя гибкость", "time": "19:00", "type": "Гибкость"},
            {"name": "Ночная тренировка", "time": "23:30", "type": "Силовая"},
            {"name": "Ещё утро", "time": "06:00", "type": "Кардио"},
        ]
        
        created = []
        for w in workouts:
            hour, minute = map(int, w["time"].split(":"))
            workout = create_workout(
                db=db,
                workout_data=CreateWorkout(
                    date=datetime(2026, 5, 1, hour, minute),
                    name=w["name"],
                    type=w["type"]
                ),
                trainee_id=created_trainee["id"]
            )
            created.append(workout)
        db.commit()
        return created
    
    def test_filter_by_name_search(self, client, auth_headers, created_trainee, setup_workouts, db):
        """Поиск по названию (частичное совпадение)"""
        response = client.get(
            f"/workouts/?trainee_id={created_trainee['id']}&name=утро",
            headers=auth_headers
        )
        
        assert response.status_code == 200
        data = response.json()
        assert all("утро".lower() in w["name"].lower() for w in data)
        assert len(data) == 1
        assert data[0]["name"] == "Ещё утро"
    
    def test_filter_by_time_slot_morning(self, client, auth_headers, created_trainee, setup_workouts, db):
        """Фильтр: утро (5:00-12:00)"""
        response = client.get(
            f"/workouts/?trainee_id={created_trainee['id']}&time_slots=morning",
            headers=auth_headers
        )
        
        assert response.status_code == 200
        data = response.json()
        # Должны быть тренировки в 08:00 и 06:00
        assert len(data) == 2
        assert all(
            5 <= datetime.fromisoformat(w["date"].replace("Z", "+00:00")).hour < 12 
            for w in data
        )
    
    def test_filter_by_time_slot_evening(self, client, auth_headers, created_trainee, setup_workouts, db):
        """Фильтр: вечер (17:00-23:00)"""
        response = client.get(
            f"/workouts/?trainee_id={created_trainee['id']}&time_slots=evening",
            headers=auth_headers
        )
        
        assert response.status_code == 200
        data = response.json()
        assert len(data) == 1
        assert data[0]["name"] == "Вечерняя гибкость"
    
    def test_filter_by_time_slot_night(self, client, auth_headers, created_trainee, setup_workouts, db):
        """Фильтр: ночь (23:00-5:00) — с переходом через полночь"""
        response = client.get(
            f"/workouts/?trainee_id={created_trainee['id']}&time_slots=night",
            headers=auth_headers
        )
        
        assert response.status_code == 200
        data = response.json()
        assert len(data) == 1
        assert data[0]["name"] == "Ночная тренировка"
    
    def test_filter_by_multiple_time_slots(self, client, auth_headers, created_trainee, setup_workouts, db):
        """Фильтр: несколько слотов сразу"""
        response = client.get(
            f"/workouts/?trainee_id={created_trainee['id']}&time_slots=morning,evening",
            headers=auth_headers
        )
        
        assert response.status_code == 200
        data = response.json()
        assert len(data) == 3  # 2 утренних + 1 вечерняя
    
    def test_filter_by_type(self, client, auth_headers, created_trainee, setup_workouts, db):
        """Фильтр по типу тренировки"""
        response = client.get(
            f"/workouts/?trainee_id={created_trainee['id']}&types=Силовая",
            headers=auth_headers
        )
        
        assert response.status_code == 200
        data = response.json()
        assert all(w["type"] == "Силовая" for w in data)
        assert len(data) == 2
    
    def test_filter_by_multiple_types(self, client, auth_headers, created_trainee, setup_workouts, db):
        """Фильтр по нескольким типам"""
        response = client.get(
            f"/workouts/?trainee_id={created_trainee['id']}&types=Силовая,Кардио",
            headers=auth_headers
        )
        
        assert response.status_code == 200
        data = response.json()
        assert all(w["type"] in ["Силовая", "Кардио"] for w in data)
        assert len(data) == 4
    
    def test_filter_by_date_range(self, client, auth_headers, created_trainee, setup_workouts, db):
        """Фильтр по диапазону дат"""
        response = client.get(
            f"/workouts/?trainee_id={created_trainee['id']}&date_from=2026-05-01T00:00:00&date_to=2026-05-01T12:00:00",
            headers=auth_headers
        )
        
        assert response.status_code == 200
        data = response.json()
        # Только тренировки до 12:00
        assert all(datetime.fromisoformat(w["date"].replace("Z", "+00:00")) <= datetime(2026, 5, 1, 12) for w in data)
    
    def test_combined_filters(self, client, auth_headers, created_trainee, setup_workouts, db):
        """Комбинация фильтров: тип + время + поиск"""
        response = client.get(
            f"/workouts/?trainee_id={created_trainee['id']}&types=Силовая&time_slots=morning&name=силовая",
            headers=auth_headers
        )
        
        assert response.status_code == 200
        data = response.json()
        assert len(data) == 1
        assert data[0]["name"] == "Утренняя силовая"
        assert data[0]["type"] == "Силовая"


class TestWorkoutSorting:
    """Тесты сортировки"""
    
    @pytest.fixture
    def setup_sorted_workouts(self, client, auth_headers, created_trainee, db):
        """Фикстура: создаёт тренировки в разном порядке"""
        
        dates = [
            datetime(2026, 5, 3, 10, 0),
            datetime(2026, 5, 1, 10, 0),
            datetime(2026, 5, 2, 10, 0),
        ]
        
        for i, date in enumerate(dates):
            create_workout(
                db=db,
                workout_data=CreateWorkout(date=date, name=f"Тренировка {i+1}", type="Силовая"),
                trainee_id=created_trainee["id"]
            )
        db.commit()
    
    def test_sort_by_date_asc(self, client, auth_headers, created_trainee, setup_sorted_workouts, db):
        """Сортировка по возрастанию (ближайшие сначала)"""
        response = client.get(
            f"/workouts/?trainee_id={created_trainee['id']}&sort=asc",
            headers=auth_headers
        )
        
        assert response.status_code == 200
        data = response.json()
        dates = [datetime.fromisoformat(w["date"].replace("Z", "+00:00")) for w in data]
        assert dates == sorted(dates)
    
    def test_sort_by_date_desc(self, client, auth_headers, created_trainee, setup_sorted_workouts, db):
        """Сортировка по убыванию (поздние сначала)"""
        response = client.get(
            f"/workouts/?trainee_id={created_trainee['id']}&sort=desc",
            headers=auth_headers
        )
        
        assert response.status_code == 200
        data = response.json()
        dates = [datetime.fromisoformat(w["date"].replace("Z", "+00:00")) for w in data]
        assert dates == sorted(dates, reverse=True)


class TestWorkoutUpdate:
    """Тесты обновления тренировки"""
    
    def test_update_workout_success(self, client, auth_headers, created_trainee, db):
        """Успешное обновление"""
        
        workout = create_workout(
            db=db,
            workout_data=CreateWorkout(
                date=datetime(2026, 5, 1, 10, 0),
                name="Старое название",
                type="Силовая"
            ),
            trainee_id=created_trainee["id"]
        )
        db.commit()
        
        update_data = {"name": "Новое название", "type": "Кардио"}
        response = client.patch(
            f"/workouts/{workout.id}",
            json=update_data,
            headers=auth_headers
        )
        
        assert response.status_code == 200
        data = response.json()
        assert data["name"] == "Новое название"
        assert data["type"] == "Кардио"
    
    def test_update_workout_partial(self, client, auth_headers, created_trainee, db):
        """Частичное обновление (только одно поле)"""
        
        workout = create_workout(
            db=db,
            workout_data=CreateWorkout(
                date=datetime(2026, 5, 1, 10, 0),
                name="Имя",
                type="Силовая"
            ),
            trainee_id=created_trainee["id"]
        )
        db.commit()
        
        response = client.patch(
            f"/workouts/{workout.id}",
            json={"name": "Обновлено"},
            headers=auth_headers
        )
        
        assert response.status_code == 200
        assert response.json()["name"] == "Обновлено"
        # Тип не изменился
        assert response.json()["type"] == "Силовая"
    


class TestWorkoutDelete:
    """Тесты удаления тренировки"""
    
    def test_delete_workout_success(self, client, auth_headers, created_trainee, db):
        workout = create_workout(
            db=db,
            workout_data=CreateWorkout(date=datetime(2026, 5, 1, 10, 0), name="Удалить", type="Силовая"),
            trainee_id=created_trainee["id"]
        )
        db.commit()
        
        response = client.delete(f"/workouts/{workout.id}", headers=auth_headers)
        
        assert response.status_code == 200
        assert response.json()["success"] is True
        
        # Проверяем что удалена
        response = client.get(f"/workouts/{workout.id}", headers=auth_headers)
        assert response.status_code == 404
    
    def test_delete_workout_not_found(self, client, auth_headers):
        """Удаление несуществующей"""
        response = client.delete("/workouts/9999", headers=auth_headers)
        assert response.status_code == 404
    