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
    date_from: Optional[datetime],
    date_to: Optional[datetime],
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    
    trainee = get_trainee_by_id(db=db, trainee_id=trainee_id)
    if trainee.coach_id != current_user.id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Доступ запрещён")
    
    try:
        workouts = get_workouts_by_trainee(
            db=db,
            trainee_id=trainee_id,
            date_from=date_from,
            date_to=date_to
        )
        return workouts
    except Exception as e:
        raise HTTPException(status_code=500, detail="Ошибка при получении списка тренировок")

@workout_router.get("/{workout_id}", response_model=WorkoutResponse)
async def get_workout(
    workout_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    try:
        workout = get_workout_by_id(db=db, workout_id=workout_id)
        trainee = get_trainee_by_id(db=db, trainee_id=workout.trainee_id)
        if trainee.coach_id != current_user.id:
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Доступ запрещён")
        return workout
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail="Ошибка при получении тренировки")


# POST
@workout_router.post("/trainee/{trainee_id}", response_model=WorkoutResponse)
async def create(
    workout_data: CreateWorkout,
    trainee_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    try:
        workout = create_workout(
            db=db,
            workout_data=workout_data,
            trainee_id=trainee_id
        )
        return workout
    except Exception as e:
        raise HTTPException(status_code=500, detail="Ошибка при создании тренировки")

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
        if trainee.coach_id != current_user.id:
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Доступ запрещён")
        
        updated_workout = update_workout(db=db, workout_id=workout_id, update_data=update_data)
        return updated_workout
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail="Ошибка при обновлении тренировки")
    
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
        if trainee.coach_id != current_user.id:
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Доступ запрещён")
        
        result = delete_workout(db=db, workout_id=workout_id)
        return result
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail="Ошибка при удалении тренировки")
