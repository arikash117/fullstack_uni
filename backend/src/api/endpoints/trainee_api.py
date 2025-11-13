from fastapi import APIRouter, Depends, Query, HTTPException
from sqlalchemy.orm import Session
from typing import List, Optional

from database.db import get_db
from schemas.trainee import (
    TraineesResponse,
    TraineeResponse,
    CreateTrainee,
)
from crud.trainee import (
    get_list_trainees,
    create_trainee,
)


trainee_router = APIRouter(prefix="/trainees")

# GET
@trainee_router.get("/", response_model=List[TraineesResponse])
async def get_trainees(
    db: Session = Depends(get_db),
    name: Optional[str] = Query(None),
):
    trainees = get_list_trainees(db=db, name=name)
    return trainees

# POST
@trainee_router.post("/", response_model=TraineeResponse)
async def create(
    trainee_data: CreateTrainee,
    coach_id: int,
    db: Session = Depends(get_db),
):
    try:
        trainee = create_trainee(db=db, trainee_data=trainee_data, coach_id=coach_id)
        return trainee
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail="Ошибка при создании тренирующегося")
