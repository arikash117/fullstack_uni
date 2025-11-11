from models import trainee
from database.db import Base
from sqlalchemy import Column, Integer, String, Boolean, DateTime, Date, ForeignKey, Float, CheckConstraint
from sqlalchemy.orm import relationship

class Workout(Base):

    __tablename__ = "workouts"
    id = Column(Integer, primary_key=True, autoincrement=True)
    trainee_id = Column(Integer, ForeignKey(trainee.id), nullable=False)
    
    date = Column(DateTime, nullable=False)
    description = Column(String, nullable=False)

    workout_owner = relationship("Trainee", back_populates="workouts")
