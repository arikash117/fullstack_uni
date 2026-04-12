from sqlalchemy.orm import Session
from sqlalchemy import or_, and_, extract, func
from typing import List, Optional
from datetime import datetime
from src.models.workout import Workout
from src.schemas.workout import (
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

    #поиск
    name: Optional[str] = None,
    # фильтры
    time_slots: Optional[List[str]] = None,
    types: Optional[List[str]] = None,

    date_from: Optional[datetime] = None,
    date_to: Optional[datetime] = None,
    
    # сортировка
    sort: str = "asc",
) -> List[WorkoutsResponse]:
    
    query = db.query(Workout).filter(Workout.trainee_id == trainee_id)

    # поиск
    if name:
        query = query.filter(Workout.name.ilike(f"%{name}%"))

    # фильтр по временным отрезкам
    if time_slots:
        time_conditions = []
        
        if "morning" in time_slots:  # 5:00 - 12:00
            time_conditions.append(
                and_(
                    extract('hour', Workout.date) >= 5,
                    extract('hour', Workout.date) < 12
                )
            )
        
        if "afternoon" in time_slots:  # 12:00 - 17:00
            time_conditions.append(
                and_(
                    extract('hour', Workout.date) >= 12,
                    extract('hour', Workout.date) < 17
                )
            )
        
        if "evening" in time_slots:  # 17:00 - 23:00
            time_conditions.append(
                and_(
                    extract('hour', Workout.date) >= 17,
                    extract('hour', Workout.date) < 23
                )
            )
        
        if "night" in time_slots:  # 23:00 - 5:00
            time_conditions.append(
                or_(
                    extract('hour', Workout.date) >= 23,
                    extract('hour', Workout.date) < 5
                )
            )
        
        if time_conditions:
            query = query.filter(or_(*time_conditions))

    # фильтр по типу
    if types:
        query = query.filter(Workout.type.in_(types))

    # фильтр по дате (чтоб раполагались сначала ближайшие) дефолтный неизменяемый фильтр
    if date_from and date_to:
        query = query.filter(
            Workout.date >= date_from,
            Workout.date <= date_to
        )
    elif date_from:
        query = query.filter(Workout.date >= date_from)
    elif date_to:
        query = query.filter(Workout.date <= date_to)

    # сортировка
    if sort == "desc":
        query = query.order_by(Workout.date.desc())
    else:
        query = query.order_by(Workout.date.asc())

    workouts = query.offset(skip).limit(limit).all()

    return [
        WorkoutsResponse(
            id=workout.id,
            date=workout.date,
            name=workout.name,
            type=workout.type,
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
        name=workout.name,
        type=workout.type,
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
        name=new_workout.name,
        type=new_workout.type,
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
        name=workout.name,
        type=workout.type,
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
