from pydantic import BaseModel
from datetime import datetime
from typing import Optional, List


class WorkoutBase(BaseModel):
    date: datetime
    description: str

class CreateWorkout(WorkoutBase):
    pass

class UpdateWorkout(BaseModel):
    date: Optional[datetime] = None
    description: Optional[str] = None

class WorkoutResponse(WorkoutBase):
    id: int
    trainee_id: int

class WorkoutsResponse(BaseModel):
    id: int
    date: datetime
    description: str

class DeleteWorkoutResponse(BaseModel):
    success: bool
    message: str
    deleted_workout_id: int
