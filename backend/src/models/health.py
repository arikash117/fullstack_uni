from src.models.trainee import Trainee
from src.database.db import Base
from sqlalchemy import Column, Integer, String, ForeignKey, Float, CheckConstraint, Date, Index
from sqlalchemy.orm import relationship

class Health(Base):

    __tablename__ = "health"
    id = Column(Integer, primary_key=True, autoincrement=True)
    trainee_id = Column(Integer, ForeignKey(Trainee.id), nullable=False)

    todays_date = Column(Date, nullable=False)
    carbohydrates = Column(Integer,  CheckConstraint('carbohydrates <= 9999'), nullable=True)
    fat = Column(Integer,  CheckConstraint('fat <= 9999'), nullable=True)
    protein = Column(Integer,  CheckConstraint('protein <= 9999'), nullable=True)
    water = Column(Float, nullable=True)
    injuries = Column(String(255), nullable=True)
    steps = Column(Integer,  CheckConstraint('steps <= 500000'), nullable=True)
    burned_calories = Column(Integer, CheckConstraint('burned_calories <= 9999'), nullable=True)
    obtained_calories = Column(Integer, CheckConstraint('obtained_calories <= 9999'), nullable=True)

    health_owner = relationship("Trainee", back_populates="health_data")

    __table_args__ = (
        Index('idx_health_trainee_id', 'trainee_id'),
        Index('idx_health_date', 'todays_date'),
        Index('idx_health_trainee_date', 'trainee_id', todays_date.desc()),
    )
