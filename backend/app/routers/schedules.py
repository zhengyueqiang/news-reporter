from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
from datetime import datetime
from app.database import get_db
from app import models, schemas
from app.utils.security import get_current_user
from app.services.report_generator import generate_and_save_report
from app.scheduler import _compute_next_run

router = APIRouter()


@router.post("", response_model=schemas.ReportScheduleResponse)
def create_schedule(
    schedule_in: schemas.ReportScheduleCreate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    query_id = schedule_in.query_id
    if query_id:
        query = db.query(models.Query).filter(
            models.Query.id == query_id,
            models.Query.user_id == current_user.id,
        ).first()
        if not query:
            raise HTTPException(status_code=404, detail="Query not found")
        title = query.topic
    else:
        title = schedule_in.title

    now = datetime.now()
    schedule = models.ReportSchedule(
        user_id=current_user.id,
        query_id=query_id,
        title=title,
        period=schedule_in.period,
        is_active=schedule_in.is_active,
        next_run_at=_compute_next_run(now, schedule_in.period),
        last_run_at=now,
    )
    db.add(schedule)
    db.commit()
    db.refresh(schedule)

    try:
        generate_and_save_report(
            db=db,
            user_id=current_user.id,
            title=title,
            period=schedule_in.period,
            query_id=query_id,
            schedule_id=schedule.id,
        )
    except RuntimeError as e:
        raise HTTPException(status_code=400, detail=str(e))

    return schedule


@router.get("", response_model=List[schemas.ReportScheduleResponse])
def list_schedules(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    return (
        db.query(models.ReportSchedule)
        .filter(models.ReportSchedule.user_id == current_user.id)
        .order_by(models.ReportSchedule.created_at.desc())
        .all()
    )


@router.put("/{schedule_id}", response_model=schemas.ReportScheduleResponse)
def update_schedule(
    schedule_id: int,
    update_in: schemas.ReportScheduleUpdate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    schedule = db.query(models.ReportSchedule).filter(
        models.ReportSchedule.id == schedule_id,
        models.ReportSchedule.user_id == current_user.id,
    ).first()
    if not schedule:
        raise HTTPException(status_code=404, detail="Schedule not found")

    if update_in.is_active is not None:
        schedule.is_active = update_in.is_active
        if schedule.is_active and schedule.next_run_at < datetime.now():
            schedule.next_run_at = _compute_next_run(datetime.now(), schedule.period)

    db.commit()
    db.refresh(schedule)
    return schedule


@router.delete("/{schedule_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_schedule(
    schedule_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    schedule = db.query(models.ReportSchedule).filter(
        models.ReportSchedule.id == schedule_id,
        models.ReportSchedule.user_id == current_user.id,
    ).first()
    if not schedule:
        raise HTTPException(status_code=404, detail="Schedule not found")

    db.delete(schedule)
    db.commit()
    return
