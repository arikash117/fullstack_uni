from src.database.db import Base
from sqlalchemy import Column, Integer, String, DateTime, ForeignKey, Index
from sqlalchemy.orm import relationship

class Workout(Base):

    __tablename__ = "workouts"
    id = Column(Integer, primary_key=True, autoincrement=True)
    trainee_id = Column(Integer, ForeignKey("trainees.id", ondelete="CASCADE"), nullable=False)
    
    date = Column(DateTime, nullable=False)
    name = Column(String(255), nullable=False)
    type = Column(String(50), nullable=False, default="Силовая")

    workout_owner = relationship("Trainee", back_populates="workouts")

    __table_args__ = (
        Index('idx_workouts_trainee_date', 'trainee_id', 'date'),
    )
