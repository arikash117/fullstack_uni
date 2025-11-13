from models import user
from database.db import Base
from sqlalchemy import Column, Integer, String, DateTime, Date, ForeignKey
from sqlalchemy.orm import relationship

class Trainee(Base):

    __tablename__ = "trainees"
    id = Column(Integer, primary_key=True, autoincrement=True)
    coach_id = Column(Integer, ForeignKey('user.id'), nullable=False)

    name = Column(String(20), nullable=False, index=True)
    phone = Column(String(20), nullable=False, unique=True)
    goal = Column(String(255), nullable=False)
    subscription_end = Column(Date, nullable=False)
    next_training = Column(DateTime(timezone=True), nullable=False)

    coach = relationship("User", back_populates="trainees") #coach_id

    health_data = relationship("Health", back_populates="health_owner")
    workouts = relationship("Workout", back_populates="workout_owner")
