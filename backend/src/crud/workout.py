from sqlalchemy.orm import Session
from typing import List, Optional
from datetime import datetime
from models.workout import Workout
from schemas.workout import (
    WorkoutResponse,
    WorkoutsResponse,
    CreateWorkout,
    UpdateWorkout,
    DeleteWorkoutResponse,
)


# список тренировок
def get_workouts_by_trainee(
    db: Session,
    trainee_id: int,
    skip: int = 0,
    limit: int = 100,
    date_from: Optional[datetime] = None,
    date_to: Optional[datetime] = None
) -> List[WorkoutsResponse]:
    
    query = db.query(Workout).filter(Workout.trainee_id == trainee_id)

    if date_from and date_to:
        query = query.filter(
            Workout.date >= date_from,
            Workout.date <= date_to
        )
    elif date_from:
        query = query.filter(Workout.date >= date_from)
    elif date_to:
        query = query.filter(Workout.date <= date_to)

    workouts = query.order_by(Workout.date.desc()).offset(skip).limit(limit).all()

    return [
        WorkoutsResponse(
            id=workout.id,
            date=workout.date,
            description=workout.description
        ) for workout in workouts
    ]

# получение инфо об одной тренировке
def get_workout_by_id(
    db: Session,
    workout_id: int
) -> WorkoutResponse:
    workout = db.query(Workout).filter(Workout.id == workout_id).first()
    
    if not workout:
        raise ValueError(f"Тренировка с ID {workout_id} не найдена")
    
    return WorkoutResponse(
        id=workout.id,
        trainee_id=workout.trainee_id,
        date=workout.date,
        description=workout.description
    )

# создание тренировки
def create_workout(
    db: Session,
    workout_data: CreateWorkout,
    trainee_id: int
) -> WorkoutResponse:
    
    new_workout = Workout(
        **workout_data.model_dump(),
        trainee_id=trainee_id
    )
    
    db.add(new_workout)
    db.commit()
    db.refresh(new_workout)
    
    return WorkoutResponse(
        id=new_workout.id,
        trainee_id=new_workout.trainee_id,
        date=new_workout.date,
        description=new_workout.description
    )

# изменение тренировки
def update_workout(
    db: Session,
    workout_id: int,
    update_data: UpdateWorkout
) -> WorkoutResponse:
    workout = db.query(Workout).filter(Workout.id == workout_id).first()
    
    if not workout:
        raise ValueError(f"Тренировка с ID {workout_id} не найдена")
    
    update_dict = update_data.model_dump(exclude_unset=True)
    
    for field, value in update_dict.items():
        setattr(workout, field, value)
    
    db.commit()
    db.refresh(workout)
    
    return WorkoutResponse(
        id=workout.id,
        trainee_id=workout.trainee_id,
        date=workout.date,
        description=workout.description
    )

# удаление тренировки (только одна за раз!!)
def delete_workout(
    db: Session,
    workout_id: int
) -> DeleteWorkoutResponse:
    
    workout = db.query(Workout).filter(Workout.id == workout_id).first()
    
    if not workout:
        raise ValueError(f"Тренировка с ID {workout_id} не найдена")
    
    deleted_id = workout.id

    db.delete(workout)
    db.commit()
    
    return DeleteWorkoutResponse(
        success=True,
        message=f"Тренировка с ID {deleted_id} успешно удалена",
        deleted_workout_id=deleted_id
    )
