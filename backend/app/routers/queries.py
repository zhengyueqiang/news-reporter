from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from app.database import get_db
from app import models, schemas
from app.utils.security import get_current_user

router = APIRouter()


@router.post("", response_model=schemas.QueryResponse)
def create_query(
    query_in: schemas.QueryCreate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    query = models.Query(user_id=current_user.id, topic=query_in.topic)
    db.add(query)
    db.commit()
    db.refresh(query)
    return query


@router.get("", response_model=List[schemas.QueryResponse])
def list_queries(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    return db.query(models.Query).filter(models.Query.user_id == current_user.id).order_by(models.Query.created_at.desc()).all()


@router.get("/{query_id}", response_model=schemas.QueryResponse)
def get_query(
    query_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    query = db.query(models.Query).filter(
        models.Query.id == query_id,
        models.Query.user_id == current_user.id
    ).first()
    if not query:
        raise HTTPException(status_code=404, detail="Query not found")
    return query
