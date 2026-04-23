from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session
from typing import List, Optional
from datetime import datetime

from src.crud import trainee
from src.core.auth import get_current_user
from src.models.user import User
from src.database.db import get_db
from src.models.workout import Workout
from src.schemas.workout import (
    WorkoutResponse, 
    WorkoutsResponse, 
    CreateWorkout, 
    UpdateWorkout,
    DeleteWorkoutResponse,
)
from src.crud.workout import (
    get_workouts_by_trainee,
    get_workout_by_id,
    create_workout,
    update_workout,
    delete_workout
)
from src.crud.trainee import get_trainee_by_id

workout_router = APIRouter(prefix="/workouts")


# GET
@workout_router.get("/", response_model=List[WorkoutsResponse])
async def get_workouts_list(
    trainee_id: int,

    # поиск
    name: Optional[str] = Query(None, description="Поиск по названию (частичное совпадение)"),

    # фильтры по времени и типу
    time_slots: Optional[str] = Query(None, description="Временные слоты: morning,afternoon,evening,night"),
    types: Optional[str] = Query(None, description="Типы: Силовая,Кардио,Гибкость"),

    date_from: Optional[datetime] = Query(None),
    date_to: Optional[datetime] = Query(None),

    # сортировка
    sort: Optional[str] = Query("asc", description="Сортировка: asc (ближайшие), desc (поздние)"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    
    trainee = get_trainee_by_id(db=db, trainee_id=trainee_id)
    if current_user.role != "admin" and trainee.coach_id != current_user.id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Доступ запрещён")
    
    try:
        workouts = get_workouts_by_trainee(
            db=db,
            trainee_id=trainee_id,
            
            # поиск
            name=name,
            # фильтры
            time_slots=time_slots,
            types=types,

            date_from=date_from,
            date_to=date_to,

            # сортировка
            sort=sort,
        )
        return workouts
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Ошибка при получении списка тренировок")

@workout_router.get("/{workout_id}", response_model=WorkoutResponse)
async def get_workout(
    workout_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    try:
        workout = get_workout_by_id(db=db, workout_id=workout_id)
        trainee = get_trainee_by_id(db=db, trainee_id=workout.trainee_id)
        if current_user.role != "admin" and trainee.coach_id != current_user.id:
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Доступ запрещён")
        return workout
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Ошибка при получении тренировки")


# POST
@workout_router.post("/trainee/{trainee_id}", response_model=WorkoutResponse)
async def create(
    trainee_id: int,
    workout_data: CreateWorkout,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    try:
        trainee = get_trainee_by_id(db=db, trainee_id=trainee_id)
        if current_user.role != "admin" and trainee.coach_id != current_user.id:
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Доступ запрещён")
        
        workout = create_workout(
            db=db,
            workout_data=workout_data,
            trainee_id=trainee_id
        )
        return workout
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=f"Ошибка при создании тренировки: {str(e)}")

# PATCH
@workout_router.patch("/{workout_id}", response_model=WorkoutResponse)
async def update(
    update_data: UpdateWorkout,
    workout_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    try:
        workout = get_workout_by_id(db=db, workout_id=workout_id)
        trainee = get_trainee_by_id(db=db, trainee_id=workout.trainee_id)
        if current_user.role != "admin" and trainee.coach_id != current_user.id:
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Доступ запрещён")
        
        updated_workout = update_workout(db=db, workout_id=workout_id, update_data=update_data)
        return updated_workout
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Ошибка при обновлении тренировки")
    
# DELETE
@workout_router.delete("/{workout_id}", response_model=DeleteWorkoutResponse)
async def delete(
    workout_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    try:
        workout = get_workout_by_id(db=db, workout_id=workout_id)
        trainee = get_trainee_by_id(db=db, trainee_id=workout.trainee_id)
        if current_user.role != "admin" and trainee.coach_id != current_user.id:
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Доступ запрещён")
        
        result = delete_workout(db=db, workout_id=workout_id)
        return result
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Ошибка при удалении тренировки")
