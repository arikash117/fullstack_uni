from src.models.trainee import Trainee
from src.database.db import Base
from sqlalchemy import Column, Integer, String, DateTime, ForeignKey, Index
from sqlalchemy.orm import relationship

class Workout(Base):

    __tablename__ = "workouts"
    id = Column(Integer, primary_key=True, autoincrement=True)
    trainee_id = Column(Integer, ForeignKey(Trainee.id), nullable=False)
    
    date = Column(DateTime, nullable=False)
    description = Column(String, nullable=False)

    workout_owner = relationship("Trainee", back_populates="workouts")

    __table_args__ = (
        Index('idx_workouts_trainee_date', 'trainee_id', 'date'),
    )
