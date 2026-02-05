from src.models.workout import Workout
# from src.models.health import Health
from src.database.db import Base
from sqlalchemy import Column, Integer, String, Date, ForeignKey, Index
from sqlalchemy.ext.hybrid import hybrid_property
from sqlalchemy import select, func
from datetime import datetime
from sqlalchemy.orm import relationship

class Trainee(Base):

    __tablename__ = "trainees"
    id = Column(Integer, primary_key=True, autoincrement=True)
    coach_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)

    name = Column(String(20), nullable=False, index=True)
    phone = Column(String(20), nullable=False, unique=True)
    goal = Column(String(255), nullable=False)
    subscription_end = Column(Date, nullable=False)

    photo_path = Column(String(255), nullable=True)

    coach = relationship("User", back_populates="trainees") #coach_id

    # health_data = relationship(Health, back_populates="health_owner")
    workouts = relationship("Workout", back_populates="workout_owner", passive_deletes=True)

    @hybrid_property
    def next_training(self):
        if hasattr(self, '_sa_instance_state'):
            if getattr(self._sa_instance_state, 'deleted', False):
                return None
        
        if not self.workouts:
            return None

        future_workouts = [w for w in self.workouts if w.date > datetime.utcnow()]

        if not future_workouts:
            return None
        
        return min(future_workouts, key=lambda w: w.date).date
    
    @next_training.expression
    def next_training(cls):
        return select(Workout.date).where(
            Workout.trainee_id == cls.id,
            Workout.date > func.now()
        ).order_by(Workout.date).limit(1).scalar_subquery()

    __table_args__ = (
        Index('idx_trainee_coach_name', 'coach_id', 'name'),
    )
