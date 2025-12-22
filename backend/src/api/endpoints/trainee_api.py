from fastapi import APIRouter, Depends, Query, HTTPException
from sqlalchemy.orm import Session
from typing import List, Optional

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
):
    trainees = get_list_trainees(db=db, name=name)
    return trainees

@trainee_router.get("/{trainee_id}", response_model=TraineeResponse)
def get_trainee(
    trainee_id: int,
    db: Session = Depends(get_db)
):
    try:
        trainee = get_trainee_by_id(db=db, trainee_id=trainee_id)
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

# PATCH
@trainee_router.patch("/{trainee_id}", response_model=TraineeResponse)
def update_trainee(
    trainee_id: int,
    update_data: UpdateTrainee,
    db: Session = Depends(get_db)
):
    try:
        trainee = update_trainee_by_id(db=db, trainee_id=trainee_id, update_data=update_data)
        return trainee
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail="Ошибка при обновлении тренирующегося")

# DELETE
@trainee_router.delete("/{trainee_id}", response_model=DeleteTraineeResponse)
def delete(
    trainee_id: int,
    db: Session = Depends(get_db)
):
    try:
        result = delete_trainee(db=db, trainee_id=trainee_id)
        return result
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail="Ошибка при удалении тренирующегося")
