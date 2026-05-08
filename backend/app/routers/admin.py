import random
import string
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import Optional
from app.database import get_db
from app import models, schemas
from app.utils.security import get_current_admin, get_password_hash

router = APIRouter()


def _check_self_modify(user_id: int, current_admin: models.User):
    if user_id == current_admin.id:
        raise HTTPException(status_code=400, detail="Cannot modify yourself")


@router.get("/users", response_model=schemas.PaginatedUserResponse)
def list_users(
    page: int = 1,
    page_size: int = 10,
    keyword: Optional[str] = None,
    db: Session = Depends(get_db),
    current_admin: models.User = Depends(get_current_admin)
):
    query = db.query(models.User)
    if keyword:
        like = f"%{keyword}%"
        query = query.filter(
            (models.User.username.ilike(like)) | (models.User.email.ilike(like))
        )
    total = query.count()
    users = query.order_by(models.User.created_at.desc()).offset((page - 1) * page_size).limit(page_size).all()
    total_pages = (total + page_size - 1) // page_size
    return {
        "items": users,
        "total": total,
        "page": page,
        "page_size": page_size,
        "total_pages": total_pages,
    }


@router.post("/users", response_model=schemas.UserResponse)
def create_user(
    user_in: schemas.UserCreateByAdmin,
    db: Session = Depends(get_db),
    current_admin: models.User = Depends(get_current_admin)
):
    existing = db.query(models.User).filter(
        (models.User.username == user_in.username) | (models.User.email == user_in.email)
    ).first()
    if existing:
        raise HTTPException(status_code=400, detail="Username or email already exists")

    user = models.User(
        username=user_in.username,
        email=user_in.email,
        hashed_password=get_password_hash(user_in.password),
        is_admin=user_in.is_admin,
        status=user_in.status
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    return user


@router.put("/users/{user_id}", response_model=schemas.UserResponse)
def update_user(
    user_id: int,
    user_in: schemas.UserUpdate,
    db: Session = Depends(get_db),
    current_admin: models.User = Depends(get_current_admin)
):
    user = db.query(models.User).filter(models.User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    _check_self_modify(user_id, current_admin)

    if user_in.username is not None:
        conflict = db.query(models.User).filter(
            models.User.username == user_in.username,
            models.User.id != user_id
        ).first()
        if conflict:
            raise HTTPException(status_code=400, detail="Username already exists")
        user.username = user_in.username

    if user_in.email is not None:
        conflict = db.query(models.User).filter(
            models.User.email == user_in.email,
            models.User.id != user_id
        ).first()
        if conflict:
            raise HTTPException(status_code=400, detail="Email already exists")
        user.email = user_in.email

    if user_in.is_admin is not None:
        user.is_admin = user_in.is_admin

    if user_in.status is not None:
        user.status = user_in.status

    db.commit()
    db.refresh(user)
    return user


@router.put("/users/{user_id}/status")
def update_user_status(
    user_id: int,
    status: models.UserStatus,
    db: Session = Depends(get_db),
    current_admin: models.User = Depends(get_current_admin)
):
    user = db.query(models.User).filter(models.User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    _check_self_modify(user_id, current_admin)
    user.status = status
    db.commit()
    db.refresh(user)
    return user


@router.post("/users/{user_id}/reset-password", response_model=schemas.ResetPasswordResponse)
def reset_password(
    user_id: int,
    db: Session = Depends(get_db),
    current_admin: models.User = Depends(get_current_admin)
):
    user = db.query(models.User).filter(models.User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    _check_self_modify(user_id, current_admin)

    new_password = ''.join(random.choices(string.ascii_letters + string.digits, k=10))
    user.hashed_password = get_password_hash(new_password)
    db.commit()
    return {"new_password": new_password}


@router.get("/stats")
def get_dashboard_stats(
    db: Session = Depends(get_db),
    current_admin: models.User = Depends(get_current_admin)
):
    total_users = db.query(models.User).count()
    total_queries = db.query(models.Query).count()
    total_reports = db.query(models.Report).count()
    pending_users = db.query(models.User).filter(models.User.status == models.UserStatus.PENDING).count()
    return {
        "total_users": total_users,
        "total_queries": total_queries,
        "total_reports": total_reports,
        "pending_users": pending_users
    }
