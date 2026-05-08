from sqlalchemy.orm import Session
from app.database import SessionLocal
from app import models
from app.utils.security import get_password_hash
from app.config import get_settings


def init_default_admin():
    """如果数据库中没有管理员，则创建默认超级管理员。"""
    db: Session = SessionLocal()
    try:
        admin_exists = db.query(models.User).filter(models.User.is_admin == True).first()
        if admin_exists:
            print(f"[Seed] Admin user already exists: {admin_exists.username}")
            return

        settings = get_settings()
        username = settings.DEFAULT_ADMIN_USERNAME
        password = settings.DEFAULT_ADMIN_PASSWORD
        email = settings.DEFAULT_ADMIN_EMAIL

        admin_user = models.User(
            username=username,
            email=email,
            hashed_password=get_password_hash(password),
            is_admin=True,
            status=models.UserStatus.ACTIVE
        )
        db.add(admin_user)
        db.commit()
        db.refresh(admin_user)
        print(f"[Seed] Default admin created: {username} / {password}")
    finally:
        db.close()
