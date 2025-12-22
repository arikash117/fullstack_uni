from sqlalchemy.orm import Session
from src.models.user import User
from src.core.security import get_password_hash

def get_user_by_email(db: Session, email: str) -> User | None:
    return db.query(User).filter(User.email == email).first()

def get_user_by_email_or_username(db: Session, identifier: str) -> User | None:
    return db.query(User).filter(
        (User.email == identifier) | (User.username == identifier)
    ).first()

def get_user_by_username(db: Session, username: str) -> User | None:
    return db.query(User).filter(User.username == username).first()

def create_user(db: Session, email: str, username: str, password: str) -> User:
    hashed_password = get_password_hash(password)
    db_user = User(
        email=email,
        username=username,
        password_hash=hashed_password
    )
    db.add(db_user)
    db.commit()
    db.refresh(db_user)
    return db_user