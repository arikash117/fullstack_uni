from datetime import datetime, timedelta, timezone
from http.client import HTTPException
import jwt
import hashlib
from argon2 import PasswordHasher
from sqlalchemy.orm import Session
from src.models.refresh_token import RefreshToken
from src.core.config import settings

ph = PasswordHasher()

def hash_token(token: str) -> str:
    return hashlib.sha256(token.encode()).hexdigest()

def verify_password(plain_password: str, hashed_password: str) -> bool:
    try:
        return ph.verify(hashed_password, plain_password)
    except:
        return False

def get_password_hash(password: str) -> str:
    return ph.hash(password)

def create_access_token(email: str, user_id: int, role: str) -> str:
    expire = datetime.now(timezone.utc) + timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    payload = {
        "sub": email,
        "user_id": user_id,
        "role": role,
        "exp": expire,
        "iat": datetime.now(timezone.utc),
        "type": "access",
        "jti": hashlib.sha256(f"{email}{expire.timestamp()}".encode()).hexdigest()[:16]
    }
    return jwt.encode(payload, settings.SECRET_KEY, algorithm=settings.ALGORITHM)

def create_refresh_token(email: str, user_id: int) -> str:
    expire = datetime.now(timezone.utc) + timedelta(days=settings.REFRESH_TOKEN_EXPIRE_DAYS)
    payload = {
        "sub": email,
        "user_id": user_id,
        "exp": expire,
        "iat": datetime.now(timezone.utc),
        "type": "refresh",
        "jti": hashlib.sha256(f"{email}{expire.timestamp()}refresh".encode()).hexdigest()[:16]
    }
    return jwt.encode(payload, settings.SECRET_KEY, algorithm=settings.ALGORITHM)

def verify_access_token(token: str) -> dict:
    try:
        payload = jwt.decode(token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])
        if payload.get("type") != "access":
            raise ValueError("Invalid token type")
        return payload
    except jwt.PyJWTError:
        raise HTTPException(
            status_code=401,
            detail="Неверный или просроченный access token",
            headers={"WWW-Authenticate": "Bearer"},
        )

def verify_refresh_token(token: str) -> dict | None:
    try:
        payload = jwt.decode(token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])
        if payload.get("type") != "refresh":
            return None
        return payload
    except jwt.PyJWTError:
        return None

def store_refresh_token(db: Session, user_id: int, token: str, expires_at: datetime) -> RefreshToken:
    from src.models.refresh_token import RefreshToken
    
    token_hash = hash_token(token)
    db_token = RefreshToken(
        user_id=user_id,
        token_hash=token_hash,
        expires_at=expires_at
    )
    db.add(db_token)
    db.commit()
    db.refresh(db_token)
    return db_token

def get_valid_refresh_token(db: Session, token: str) -> RefreshToken | None:
    from src.models.refresh_token import RefreshToken
    
    token_hash = hash_token(token)
    db_token = db.query(RefreshToken).filter(
        RefreshToken.token_hash == token_hash,
        RefreshToken.revoked == False,
        RefreshToken.expires_at > datetime.now(timezone.utc)
    ).first()
    return db_token

def revoke_refresh_token(db: Session, token: str) -> bool:
    from src.models.refresh_token import RefreshToken
    
    token_hash = hash_token(token)
    db_token = db.query(RefreshToken).filter(RefreshToken.token_hash == token_hash).first()
    if db_token:
        db_token.revoked = True
        db.commit()
        return True
    return False

def revoke_all_user_tokens(db: Session, user_id: int) -> int:
    from src.models.refresh_token import RefreshToken
    
    count = db.query(RefreshToken).filter(
        RefreshToken.user_id == user_id,
        RefreshToken.revoked == False
    ).update({"revoked": True})
    db.commit()
    return count
