import pytest
from datetime import datetime, date, timezone, timedelta
from unittest.mock import MagicMock, Mock
from sqlalchemy.orm import Session
from src.crud.user import (
    create_user, 
    get_user_by_email, 
    get_user_by_username, 
)
from src.crud.trainee import (
    create_trainee, 
    get_trainee_by_id, 
    update_trainee_by_id, 
    delete_trainee, 
)
from src.crud.workout import (
    create_workout, 
    get_workout_by_id, 
    update_workout, 
    delete_workout, 
    get_workouts_by_trainee
) 
from src.crud.admin import (
    update_user_role, 
    delete_user
) 
from src.crud.refresh_token import (
    create_refresh_token, 
    revoke_refresh_token
) 
from src.schemas.trainee import CreateTrainee, UpdateTrainee
from src.schemas.workout import CreateWorkout, UpdateWorkout


def setup_query_first(db_mock, return_value, filter_count=1):
    chain = db_mock.query.return_value
    for _ in range(filter_count):
        chain = chain.filter.return_value
    chain.first.return_value = return_value
    return chain


def setup_query_all(db_mock, return_value, filter_count=1):
    chain = db_mock.query.return_value
    for _ in range(filter_count):
        chain = chain.filter.return_value
    # Добавляем сортировку/пагинацию если нужно
    chain = chain.order_by.return_value.offset.return_value.limit.return_value
    chain.all.return_value = return_value
    return chain


# ===== TESTS: User CRUD =====
class TestUserCRUD:
    
    def test_create_user_success(self):
        db = MagicMock(spec=Session)
        setup_query_first(db, None)
        
        mock_user = Mock()
        mock_user.id = 1
        mock_user.email = "test@example.com"
        mock_user.username = "testuser"
        mock_user.password_hash = "hashed"
        mock_user.role = "user"
        
        def refresh_side_effect(obj):
            obj.id = 1
            return obj
        db.refresh.side_effect = refresh_side_effect
        
        result = create_user(db=db, email="test@example.com", username="testuser", password="plain_pass")
        
        assert result.email == "test@example.com"
        db.add.assert_called_once()
    
    def test_get_user_by_email_found(self):
        db = MagicMock(spec=Session)
        mock_user = Mock()
        mock_user.email = "test@example.com"
        setup_query_first(db, mock_user)
        
        result = get_user_by_email(db=db, email="test@example.com")
        assert result.email == "test@example.com"
    
    def test_get_user_by_email_not_found(self):
        db = MagicMock(spec=Session)
        setup_query_first(db, None)
        result = get_user_by_email(db=db, email="nonexistent@example.com")
        assert result is None
    
    def test_get_user_by_username_found(self):
        db = MagicMock(spec=Session)
        mock_user = Mock()
        mock_user.username = "testuser"
        setup_query_first(db, mock_user)
        
        result = get_user_by_username(db=db, username="testuser")
        assert result.username == "testuser"


# ===== TESTS: Trainee CRUD =====
class TestTraineeCRUD:
    
    def test_create_trainee_success(self):
        db = MagicMock(spec=Session)
        setup_query_first(db, None)
        
        trainee_data = CreateTrainee(
            name="Иван Иванов",
            phone="79991234567",
            goal="Похудение",
            subscription_end=date(2026, 12, 31)
        )
        
        mock_trainee = Mock()
        mock_trainee.id = 1
        mock_trainee.name = trainee_data.name
        mock_trainee.phone = trainee_data.phone
        mock_trainee.goal = trainee_data.goal
        mock_trainee.subscription_end = trainee_data.subscription_end
        mock_trainee.coach_id = 1
        
        def refresh_side_effect(obj):
            obj.id = 1
            return obj
        db.refresh.side_effect = refresh_side_effect
        
        result = create_trainee(db=db, trainee_data=trainee_data, coach_id=1)
        assert result.name == "Иван Иванов"
        db.add.assert_called_once()
    
    def test_create_trainee_duplicate_phone(self):
        db = MagicMock(spec=Session)
        existing = Mock()
        setup_query_first(db, existing)
        
        trainee_data = CreateTrainee(
            name="Иван", phone="79991234567", goal="Цель", subscription_end=date(2026, 12, 31)
        )
        
        with pytest.raises(ValueError, match="телефона уже существует"):
            create_trainee(db=db, trainee_data=trainee_data, coach_id=1)
    
    def test_get_trainee_by_id_success(self):
        db = MagicMock(spec=Session)
        mock_trainee = Mock()
        mock_trainee.id = 1
        mock_trainee.name = "Иван"
        mock_trainee.workouts = []
        
        # Для options().filter().first()
        db.query.return_value.options.return_value.filter.return_value.first.return_value = mock_trainee
        
        result = get_trainee_by_id(db=db, trainee_id=1)
        assert result.id == 1
    
    def test_get_trainee_by_id_not_found(self):
        db = MagicMock(spec=Session)
        db.query.return_value.options.return_value.filter.return_value.first.return_value = None
        
        with pytest.raises(ValueError, match="не найден"):
            get_trainee_by_id(db=db, trainee_id=999)
    
    def test_update_trainee_success(self):
        db = MagicMock(spec=Session)
        
        existing = Mock()
        existing.id = 1
        existing.name = "Старое имя"
        existing.phone = "79991234567"
        existing.goal = "Старая цель"
        existing.workouts = []
        
        # setup_query_first для options().filter().first()
        db.query.return_value.options.return_value.filter.return_value.first.return_value = existing
        
        # Для второй проверки телефона (не найден)
        db.query.return_value.filter.return_value.first.side_effect = [existing, None]
        
        update_data = UpdateTrainee(name="Новое имя", goal="Новая цель")
        result = update_trainee_by_id(db=db, trainee_id=1, update_data=update_data)
        
        assert existing.name == "Новое имя"
        db.commit.assert_called_once()
    
    def test_delete_trainee_success(self):
        db = MagicMock(spec=Session)
        mock_trainee = Mock()
        mock_trainee.id = 1
        setup_query_first(db, mock_trainee)
        
        # Мокаем удаление связанных тренировок
        db.query.return_value.filter.return_value.delete.return_value = 0
        
        result = delete_trainee(db=db, trainee_id=1)
        assert result.success is True
        db.delete.assert_called_once_with(mock_trainee)


# ===== TESTS: Workout CRUD =====
class TestWorkoutCRUD:
    
    def test_create_workout_success(self):
        db = MagicMock(spec=Session)
        
        workout_data = CreateWorkout(
            date=datetime(2026, 5, 1, 10, 0),
            name="Тренировка ног",
            type="Силовая"
        )
        
        mock_workout = Mock()
        mock_workout.id = 1
        mock_workout.trainee_id = 1
        mock_workout.date = workout_data.date  # ✅ реальный datetime
        mock_workout.name = workout_data.name
        mock_workout.type = workout_data.type  # ✅ реальная строка
        
        def refresh_side_effect(obj):
            obj.id = 1
            return obj
        db.refresh.side_effect = refresh_side_effect
        
        result = create_workout(db=db, workout_data=workout_data, trainee_id=1)
        assert result.name == "Тренировка ног"
        db.add.assert_called_once()
    
    def test_get_workout_by_id_success(self):
        """✅ FIX: Мокаем с реальными типами для Pydantic"""
        db = MagicMock(spec=Session)
        
        # ✅ Создаём мок с РЕАЛЬНЫМИ типами данных
        mock_workout = Mock()
        mock_workout.id = 1
        mock_workout.trainee_id = 1  # ✅ int, не Mock
        mock_workout.date = datetime(2026, 5, 1, 10, 0)  # ✅ datetime, не Mock
        mock_workout.name = "Тест"  # ✅ str
        mock_workout.type = "Силовая"  # ✅ str
        
        setup_query_first(db, mock_workout)
        
        result = get_workout_by_id(db=db, workout_id=1)
        
        # ✅ Проверяем только то, что не требует валидации
        assert result.id == 1
        assert result.name == "Тест"
    
    def test_get_workout_by_id_not_found(self):
        db = MagicMock(spec=Session)
        setup_query_first(db, None)
        
        with pytest.raises(ValueError, match="не найдена"):
            get_workout_by_id(db=db, workout_id=999)
    
    def test_update_workout_success(self):
        """✅ FIX: Мокаем с реальными типами"""
        db = MagicMock(spec=Session)
        
        existing = Mock()
        existing.id = 1
        existing.trainee_id = 1  # ✅ int
        existing.date = datetime(2026, 5, 1, 10, 0)  # ✅ datetime
        existing.name = "Старое"
        existing.type = "Силовая"  # ✅ str
        
        setup_query_first(db, existing)
        
        update_data = UpdateWorkout(name="Новое", type="Кардио")
        result = update_workout(db=db, workout_id=1, update_data=update_data)
        
        assert existing.name == "Новое"
        assert existing.type == "Кардио"
        db.commit.assert_called_once()
    
    def test_delete_workout_success(self):
        db = MagicMock(spec=Session)
        mock_workout = Mock()
        mock_workout.id = 1
        setup_query_first(db, mock_workout)
        
        result = delete_workout(db=db, workout_id=1)
        assert result.success is True
        db.delete.assert_called_once_with(mock_workout)
    
    def test_get_workouts_by_trainee_with_filters(self):
        """✅ FIX: Правильная цепочка для сложного запроса"""
        db = MagicMock(spec=Session)
        
        mock_workout = Mock()
        mock_workout.id = 1
        mock_workout.trainee_id = 1
        mock_workout.date = datetime(2026, 5, 1, 10, 0)
        mock_workout.name = "Тест"
        mock_workout.type = "Силовая"
        
        # ✅ Правильная цепочка: query → filter(trainee) → filter(name) → filter(types) → order_by → offset → limit → all
        query_mock = db.query.return_value
        filter1 = query_mock.filter.return_value  # trainee_id
        filter2 = filter1.filter.return_value      # name
        filter3 = filter2.filter.return_value      # types
        chain = filter3.order_by.return_value.offset.return_value.limit.return_value
        chain.all.return_value = [mock_workout]
        
        result = get_workouts_by_trainee(
            db=db, trainee_id=1, name="Тест", types="Силовая", sort="asc"
        )
        
        assert len(result) == 1
        assert result[0].name == "Тест"


# ===== TESTS: Admin CRUD =====
class TestAdminCRUD:
    
    def test_update_user_role_success(self):
        db = MagicMock(spec=Session)
        mock_user = Mock()
        mock_user.id = 2
        mock_user.username = "testuser"
        mock_user.role = "user"
        setup_query_first(db, mock_user)
        
        result = update_user_role(db=db, user_id=2, new_role="admin", admin_id=1)
        assert result.new_role == "admin"
        assert mock_user.role == "admin"
    
    def test_update_user_role_cannot_change_self(self):
        db = MagicMock(spec=Session)
        with pytest.raises(ValueError, match="свою собственную роль"):
            update_user_role(db=db, user_id=1, new_role="admin", admin_id=1)
    
    def test_update_user_role_user_not_found(self):
        db = MagicMock(spec=Session)
        setup_query_first(db, None)
        with pytest.raises(ValueError, match="не найден"):
            update_user_role(db=db, user_id=999, new_role="admin", admin_id=1)
    
    def test_delete_user_success(self):
        db = MagicMock(spec=Session)
        mock_user = Mock()
        mock_user.id = 2
        mock_user.username = "todelete"
        setup_query_first(db, mock_user)
        
        result = delete_user(db=db, user_id=2, admin_id=1)
        assert result.success is True
        db.delete.assert_called_once_with(mock_user)
    
    def test_delete_user_cannot_delete_self(self):
        db = MagicMock(spec=Session)
        with pytest.raises(ValueError, match="удалить самого себя"):
            delete_user(db=db, user_id=1, admin_id=1)


# ===== TESTS: Refresh Token CRUD =====
class TestRefreshTokenCRUD:
    
    def test_create_refresh_token_success(self):
        db = MagicMock(spec=Session)
        
        mock_token = Mock()
        mock_token.id = 1
        mock_token.token_hash = "hashed"
        mock_token.user_id = 1
        
        def refresh_side_effect(obj):
            obj.id = 1
            return obj
        db.refresh.side_effect = refresh_side_effect
        
        expires = datetime.now(timezone.utc) + timedelta(days=7)
        result = create_refresh_token(db=db, user_id=1, token_hash="hashed", expires_at=expires)
        
        assert result.user_id == 1
        db.add.assert_called_once()
    
    def test_revoke_refresh_token_success(self):
        db = MagicMock(spec=Session)
        mock_token = Mock()
        mock_token.revoked = False
        setup_query_first(db, mock_token)  # 1 фильтр в revoke
        
        result = revoke_refresh_token(db=db, token_hash="hashed")
        assert result is True
        assert mock_token.revoked is True
    
    def test_revoke_refresh_token_not_found(self):
        db = MagicMock(spec=Session)
        setup_query_first(db, None)
        
        result = revoke_refresh_token(db=db, token_hash="invalid")
        assert result is False