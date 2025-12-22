from sqlalchemy.orm import Session
from typing import List, Optional
from src.models.trainee import Trainee
from src.schemas.trainee import (
    TraineesResponse,
    CreateTrainee,
    DeleteTraineeResponse,
    TraineeResponse,
    UpdateTrainee,
)

# Список trainees
def get_list_trainees(
        db: Session, 
        skip: int = 0, 
        limit: int = 10,
        name: Optional[str] = None,
) -> List[TraineesResponse]:
    
    query = db.query(Trainee)

    if name:
        query = query.filter(Trainee.name.ilike(f"{name}%"))
    
    trainees = query.offset(skip).limit(limit).all()

    return [
        TraineesResponse(
            id=trainee.id,
            name=trainee.name,
            next_training=trainee.next_training,
        ) for trainee in trainees
    ]

# Создание нового trainee
def create_trainee(
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

    return new_trainee

# Удаление trainee (только одного за раз!)
def delete_trainee(
    db: Session,
    trainee_id: int
) -> DeleteTraineeResponse:
    
    trainee = db.query(Trainee).filter(Trainee.id == trainee_id).first()

    if not trainee:
        raise ValueError(f"Тренирующийся с ID {trainee_id} не найден")
    
    deleted_id = trainee.id

    db.delete(trainee)
    db.commit()

    return DeleteTraineeResponse(
        success=True,
        message=f"Тренирующийся с ID {deleted_id} успешно удален",
        deleted_trainee_id=deleted_id
    )

# Информация о конкретном trainee
def get_trainee_by_id(
    db: Session,
    trainee_id: int
) -> Trainee:
    
    trainee = db.query(Trainee).filter(Trainee.id == trainee_id).first()
    
    if not trainee:
        raise ValueError(f"Тренирующийся с ID {trainee_id} не найден")
    
    return trainee

# изменение конкретного trainee
def update_trainee_by_id(
    db: Session,
    trainee_id: int,
    update_data: UpdateTrainee
) -> Trainee:
     
    trainee = db.query(Trainee).filter(Trainee.id == trainee_id).first()
    
    if not trainee:
        raise ValueError(f"Тренирующийся с ID {trainee_id} не найден")
    
    if update_data.phone and update_data.phone != trainee.phone:
        existing_trainee = db.query(Trainee).filter(
            Trainee.phone == update_data.phone,
            Trainee.id != trainee_id
        ).first()
        if existing_trainee:
            raise ValueError("Тренирующийся с таким номером телефона уже существует")
        
    update_dict = update_data.model_dump(exclude_unset=True)
    
    for field, value in update_dict.items():
        setattr(trainee, field, value)
    
    db.commit()
    db.refresh(trainee)
    
    return trainee
