import uuid
from fastapi import APIRouter, Depends, File, Path, Query, HTTPException, UploadFile, status
from sqlalchemy.orm import Session
from typing import List, Optional

UPLOAD_DIR = Path("uploads/trainees")
UPLOAD_DIR.mkdir(parents=True, exist_ok=True)

from src.models.user import User
from src.core.auth import get_current_user
from src.database.db import get_db
from src.schemas.trainee import (
    TraineesResponse,
    TraineeResponse,
    CreateTrainee,
    UpdateTrainee,
    DeleteTraineeResponse,
)
from src.crud.trainee import (
    get_list_trainees,
    create_trainee,
    delete_trainee,
    get_trainee_by_id,
    update_trainee_by_id,
)


trainee_router = APIRouter(prefix="/trainees")

# GET
@trainee_router.get("/", response_model=List[TraineesResponse])
def get_trainees(
    db: Session = Depends(get_db),
    name: Optional[str] = Query(None),
    current_user: User = Depends(get_current_user),
):
    trainees = get_list_trainees(db=db, name=name, coach_id=current_user.id)
    return trainees

@trainee_router.get("/{trainee_id}", response_model=TraineeResponse)
def get_trainee(
    trainee_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    try:
        trainee = get_trainee_by_id(db=db, trainee_id=trainee_id)
        if trainee.coach_id != current_user.id:
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Доступ запрещён")
        return trainee
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail="Ошибка при получении данных тренирующегося")

# POST
@trainee_router.post("/", response_model=TraineeResponse)
def create(
    trainee_data: CreateTrainee,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    try:
        trainee = create_trainee(db=db, trainee_data=trainee_data, coach_id=current_user.id)
        return trainee
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail="Ошибка при создании тренирующегося")
    
@trainee_router.post("/{trainee_id}/photo", response_model=TraineeResponse)
async def upload_trainee_photo(
    trainee_id: int,
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    # Проверка: trainee принадлежит пользователю
    trainee = get_trainee_by_id(db, trainee_id)
    if trainee.coach_id != current_user.id:
        raise HTTPException(status_code=403, detail="Нет доступа")

    # Валидация типа файла (опционально)
    if not file.content_type.startswith('image/'):
        raise HTTPException(status_code=400, detail="Можно загружать только изображения")

    # Генерируем уникальное имя: trainees/{uuid}.jpg
    file_ext = file.filename.split('.')[-1] if '.' in file.filename else 'jpg'
    safe_filename = f"{uuid.uuid4()}.{file_ext}"
    file_path = UPLOAD_DIR / safe_filename

    # Сохраняем файл
    with open(file_path, "wb") as f:
        f.write(await file.read())

    # Обновляем путь в БД
    trainee.photo_path = f"trainees/{safe_filename}"
    db.commit()
    db.refresh(trainee)

    return trainee    

# PATCH
@trainee_router.patch("/{trainee_id}", response_model=TraineeResponse)
def update_trainee(
    trainee_id: int,
    update_data: UpdateTrainee,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    try:
        trainee = get_trainee_by_id(db=db, trainee_id=trainee_id)
        if trainee.coach_id != current_user.id:
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Доступ запрещён")
        
        updated_trainee = update_trainee_by_id(db=db, trainee_id=trainee_id, update_data=update_data)
        return updated_trainee
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail="Ошибка при обновлении тренирующегося")

# DELETE
@trainee_router.delete("/{trainee_id}", response_model=DeleteTraineeResponse)
def delete(
    trainee_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    try:
        trainee = get_trainee_by_id(db=db, trainee_id=trainee_id)
        if trainee.coach_id != current_user.id:
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Доступ запрещён")
        
        result = delete_trainee(db=db, trainee_id=trainee_id)
        return result
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail="Ошибка при удалении тренирующегося")
