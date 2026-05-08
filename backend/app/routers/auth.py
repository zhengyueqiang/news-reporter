from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.database import get_db
from app import models, schemas
from app.utils.security import (
    get_password_hash, verify_password, create_access_token,
    create_refresh_token, decode_token, get_current_user
)
from app.config import get_settings

router = APIRouter()


@router.post("/register", response_model=schemas.UserResponse)
def register(user_in: schemas.UserCreate, db: Session = Depends(get_db)):
    existing = db.query(models.User).filter(
        (models.User.username == user_in.username) | (models.User.email == user_in.email)
    ).first()
    if existing:
        if existing.status == models.UserStatus.BANNED:
            raise HTTPException(status_code=400, detail="Account has been banned")
        raise HTTPException(status_code=400, detail="Username or email already registered")

    settings = get_settings()
    status = models.UserStatus.PENDING if settings.REGISTER_REQUIRES_APPROVAL else models.UserStatus.ACTIVE

    user = models.User(
        username=user_in.username,
        email=user_in.email,
        hashed_password=get_password_hash(user_in.password),
        status=status
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    return user


@router.post("/login", response_model=schemas.Token)
def login(credentials: schemas.UserLogin, db: Session = Depends(get_db)):
    user = db.query(models.User).filter(models.User.username == credentials.username).first()
    if not user or not verify_password(credentials.password, user.hashed_password):
        raise HTTPException(status_code=401, detail="Incorrect username or password")
    if user.status == models.UserStatus.BANNED:
        raise HTTPException(status_code=403, detail="Account has been banned")
    if user.status == models.UserStatus.PENDING:
        raise HTTPException(status_code=403, detail="Account is pending approval")
    if user.status == models.UserStatus.REJECTED:
        raise HTTPException(status_code=403, detail="Account has been rejected")
    if user.status != models.UserStatus.ACTIVE:
        raise HTTPException(status_code=403, detail="Account is not active")

    access_token = create_access_token({"sub": str(user.id)})
    refresh_token = create_refresh_token({"sub": str(user.id)})
    return {
        "access_token": access_token,
        "refresh_token": refresh_token,
        "token_type": "bearer",
        "user": user
    }


@router.post("/refresh", response_model=schemas.Token)
def refresh_token(refresh_token: str, db: Session = Depends(get_db)):
    payload = decode_token(refresh_token)
    if not payload or payload.get("type") != "refresh":
        raise HTTPException(status_code=401, detail="Invalid refresh token")
    user_id = payload.get("sub")
    user = db.query(models.User).filter(models.User.id == int(user_id)).first()
    if not user or user.status == models.UserStatus.BANNED:
        raise HTTPException(status_code=401, detail="Invalid refresh token")
    if user.status == models.UserStatus.PENDING:
        raise HTTPException(status_code=401, detail="Invalid refresh token")
    if user.status == models.UserStatus.REJECTED:
        raise HTTPException(status_code=401, detail="Invalid refresh token")
    if user.status != models.UserStatus.ACTIVE:
        raise HTTPException(status_code=401, detail="Invalid refresh token")

    access_token = create_access_token({"sub": str(user.id)})
    new_refresh_token = create_refresh_token({"sub": str(user.id)})
    return {
        "access_token": access_token,
        "refresh_token": new_refresh_token,
        "token_type": "bearer",
        "user": user
    }


@router.get("/me", response_model=schemas.UserResponse)
def get_me(current_user: models.User = Depends(get_current_user)):
    return current_user
