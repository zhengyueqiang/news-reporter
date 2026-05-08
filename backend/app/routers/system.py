from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import Optional
from app.database import get_db
from app import models, schemas
from app.utils.security import get_current_admin
from app.config import get_settings
from app.services.search_service import is_search_enabled

router = APIRouter()


def get_or_create_config(db: Session, key: str, default_value: str = "", description: str = "") -> models.SystemConfig:
    config = db.query(models.SystemConfig).filter(models.SystemConfig.key == key).first()
    if not config:
        config = models.SystemConfig(key=key, value=default_value, description=description)
        db.add(config)
        db.commit()
        db.refresh(config)
    return config


def get_config_value(db: Session, key: str, default: str = "") -> str:
    config = db.query(models.SystemConfig).filter(models.SystemConfig.key == key).first()
    return config.value if config and config.value is not None else default


@router.get("/config")
def get_system_config(db: Session = Depends(get_db)):
    settings = get_settings()
    configs = db.query(models.SystemConfig).all()

    def get_db_only(key: str) -> str:
        cfg = db.query(models.SystemConfig).filter(models.SystemConfig.key == key).first()
        return cfg.value if cfg and cfg.value is not None else ""

    return {
        "configs": configs,
        "register_requires_approval": settings.REGISTER_REQUIRES_APPROVAL,
        "llm_provider": get_db_only("llm_provider"),
        "llm_api_key": get_db_only("llm_api_key"),
        "llm_model": get_db_only("llm_model"),
        "search_engine": get_db_only("search_engine"),
        "search_api_key": get_db_only("search_api_key"),
        "search_enabled": is_search_enabled(),
    }


@router.put("/config")
def update_system_config(
    key: str,
    value: str,
    db: Session = Depends(get_db),
    current_admin: models.User = Depends(get_current_admin)
):
    config = db.query(models.SystemConfig).filter(models.SystemConfig.key == key).first()
    if not config:
        raise HTTPException(status_code=404, detail="Config key not found")
    config.value = value
    config.updated_by = current_admin.id
    db.commit()
    db.refresh(config)
    return config


@router.put("/llm")
def update_llm_config(
    config_in: schemas.LLMConfigUpdate,
    db: Session = Depends(get_db),
    current_admin: models.User = Depends(get_current_admin)
):
    for key, value, desc in [
        ("llm_provider", config_in.provider, "LLM 服务商"),
        ("llm_api_key", config_in.api_key, "LLM API 密钥"),
        ("llm_model", config_in.model, "LLM 模型"),
    ]:
        config = db.query(models.SystemConfig).filter(models.SystemConfig.key == key).first()
        if not config:
            config = models.SystemConfig(key=key, value=value, description=desc)
            db.add(config)
        else:
            config.value = value
        config.updated_by = current_admin.id
    db.commit()
    return {"message": "LLM config updated"}


@router.put("/search")
def update_search_config(
    config_in: schemas.SearchConfigUpdate,
    db: Session = Depends(get_db),
    current_admin: models.User = Depends(get_current_admin)
):
    for key, value, desc in [
        ("search_engine", config_in.engine, "搜索引擎"),
        ("search_api_key", config_in.api_key, "搜索引擎 API 密钥"),
    ]:
        config = db.query(models.SystemConfig).filter(models.SystemConfig.key == key).first()
        if not config:
            config = models.SystemConfig(key=key, value=value, description=desc)
            db.add(config)
        else:
            config.value = value
        config.updated_by = current_admin.id
    db.commit()
    return {"message": "Search config updated"}
