from sqlalchemy.orm import Session
from typing import List, Optional
from models.trainee import Trainee
from schemas.trainee import (
    TraineesResponse,
    CreateTrainee,
    DeleteTrainee,
    DeleteTraineeResponse,
    TraineeResponse,
    UpdateTrainee,
)

# Список trainees
async def get_list_trainees(
        db: Session, 
        skip: int = 0, 
        limit: int = 10,
        name: Optional[str] = None,
) -> List[TraineesResponse]:
    
    query = db.query(Trainee)

    if name:
        query = query.filter(Trainee.name.ilike(f"%{name}%"))
    
    trainees = query.offset(skip).limit(limit).all()

    return [
        TraineesResponse(
            id=trainee.id,
            name=trainee.name,
            next_training=trainee.next_training,
        ) for trainee in trainees
    ]

# Создание нового trainee
async def create_trainee(
    db: Session, 
    trainee_data: CreateTrainee,
    coach_id: int
) -> TraineeResponse:
    
    existing_trainee = db.query(Trainee).filter(Trainee.phone == trainee_data.phone).first()
    if existing_trainee:
        raise ValueError("Тренирующийся с таким номером телефона уже существует")
    
    new_trainee = Trainee(
        **trainee_data.model_dump(),
        coach_id=coach_id
    )

    db.add(new_trainee)
    db.commit()
    db.refresh(new_trainee)

    return new_trainee
