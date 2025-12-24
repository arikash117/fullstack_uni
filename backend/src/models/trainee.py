from src.models.user import User
# from src.models.health import Health
from src.database.db import Base
from sqlalchemy import Column, Integer, String, DateTime, Date, ForeignKey, Index
from sqlalchemy.orm import relationship

class Trainee(Base):

    __tablename__ = "trainees"
    id = Column(Integer, primary_key=True, autoincrement=True)
    coach_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)

    name = Column(String(20), nullable=False, index=True)
    phone = Column(String(20), nullable=False, unique=True)
    goal = Column(String(255), nullable=False)
    subscription_end = Column(Date, nullable=False)
    next_training = Column(DateTime(timezone=True), nullable=False)

    photo_path = Column(String, nullable=True)

    coach = relationship("User", back_populates="trainees") #coach_id

    # health_data = relationship(Health, back_populates="health_owner")
    workouts = relationship("Workout", back_populates="workout_owner")

    __table_args__ = (
        Index('idx_trainee_coach_name', 'coach_id', 'name'),
    )
