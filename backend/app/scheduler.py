import threading
import time
import calendar
import logging
from datetime import datetime, timedelta
from app.database import SessionLocal
from app import models
from app.services.report_generator import generate_and_save_report

logger = logging.getLogger(__name__)

SCHEDULER_INTERVAL = 60


def _compute_next_run(current: datetime, period: models.ReportPeriod) -> datetime:
    if period == models.ReportPeriod.DAY:
        return current + timedelta(days=1)
    elif period == models.ReportPeriod.WEEK:
        return current + timedelta(weeks=1)
    elif period == models.ReportPeriod.MONTH:
        month = current.month + 1
        year = current.year
        if month > 12:
            month = 1
            year += 1
        max_day = calendar.monthrange(year, month)[1]
        day = min(current.day, max_day)
        return current.replace(year=year, month=month, day=day)
    elif period == models.ReportPeriod.YEAR:
        return current.replace(year=current.year + 1)
    return current + timedelta(days=1)


def _execute_schedule(db, schedule: models.ReportSchedule):
    try:
        now = datetime.now()
        generate_and_save_report(
            db=db,
            user_id=schedule.user_id,
            title=schedule.title,
            period=schedule.period,
            query_id=schedule.query_id,
            schedule_id=schedule.id,
        )
        schedule.last_run_at = now
        schedule.next_run_at = _compute_next_run(now, schedule.period)
        db.commit()
    except Exception as e:
        logger.warning(f"Schedule #{schedule.id} execution failed: {e}")
        db.rollback()
        schedule.last_run_at = datetime.now()
        schedule.next_run_at = _compute_next_run(datetime.now(), schedule.period)
        db.commit()


def _tick():
    db = SessionLocal()
    try:
        now = datetime.now()
        schedules = (
            db.query(models.ReportSchedule)
            .filter(
                models.ReportSchedule.is_active == True,
                models.ReportSchedule.next_run_at <= now,
            )
            .all()
        )
        for schedule in schedules:
            _execute_schedule(db, schedule)
    finally:
        db.close()


def _run_scheduler_loop():
    while True:
        try:
            _tick()
        except Exception:
            pass
        time.sleep(SCHEDULER_INTERVAL)


def start_scheduler():
    thread = threading.Thread(target=_run_scheduler_loop, daemon=True)
    thread.start()
