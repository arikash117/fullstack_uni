from pydantic import BaseModel
from datetime import datetime
from typing import Optional, List


class WorkoutBase(BaseModel):
    date: datetime
    name: str
    type: str = "Силовая"

class CreateWorkout(WorkoutBase):
    pass

class UpdateWorkout(BaseModel):
    date: Optional[datetime] = None
    name: Optional[str] = None
    type: Optional[str] = None

class WorkoutResponse(WorkoutBase):
    id: int
    trainee_id: int

class WorkoutsResponse(BaseModel):
    id: int
    date: datetime
    name: str
    type: str

class DeleteWorkoutResponse(BaseModel):
    success: bool
    message: str
    deleted_workout_id: int
