from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List, Optional
import uuid
import os
from datetime import datetime
from app.database import get_db
from app import models, schemas
from app.utils.security import get_current_user
from app.services.report_generator import generate_and_save_report

router = APIRouter()

REPORTS_DIR = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(__file__))), "reports_data")
os.makedirs(REPORTS_DIR, exist_ok=True)


@router.post("", response_model=schemas.ReportResponse)
def create_report(
    report_in: schemas.ReportCreate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    try:
        if report_in.query_id:
            query = db.query(models.Query).filter(
                models.Query.id == report_in.query_id,
                models.Query.user_id == current_user.id
            ).first()
            topic = query.topic if query else report_in.title
        else:
            topic = report_in.title

        report = generate_and_save_report(
            db=db,
            user_id=current_user.id,
            title=topic,
            period=report_in.period,
            query_id=report_in.query_id,
        )
    except RuntimeError as e:
        raise HTTPException(status_code=400, detail=str(e))

    return report


@router.get("", response_model=List[schemas.ReportResponse])
def list_reports(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    return db.query(models.Report).filter(
        models.Report.user_id == current_user.id
    ).order_by(models.Report.created_at.desc()).all()


@router.get("/{report_id}", response_model=schemas.ReportDetailResponse)
def get_report(
    report_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    report = db.query(models.Report).filter(
        models.Report.id == report_id,
        models.Report.user_id == current_user.id
    ).first()
    if not report:
        raise HTTPException(status_code=404, detail="Report not found")

    content = None
    if report.content_path and os.path.exists(report.content_path):
        with open(report.content_path, "r", encoding="utf-8") as f:
            content = f.read()

    detail = schemas.ReportDetailResponse.from_orm(report)
    detail.content = content
    return detail


@router.put("/{report_id}", response_model=schemas.ReportResponse)
def update_report(
    report_id: int,
    update_in: schemas.ReportUpdate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    report = db.query(models.Report).filter(
        models.Report.id == report_id,
        models.Report.user_id == current_user.id
    ).first()
    if not report:
        raise HTTPException(status_code=404, detail="Report not found")

    if update_in.is_public is not None:
        report.is_public = update_in.is_public
        if report.is_public and not report.share_token:
            report.share_token = uuid.uuid4().hex
        elif not report.is_public:
            report.share_token = None

    if update_in.title is not None:
        report.title = update_in.title

    db.commit()
    db.refresh(report)
    return report


@router.get("/public/{share_token}", response_model=schemas.ReportDetailResponse)
def get_public_report(share_token: str, db: Session = Depends(get_db)):
    report = db.query(models.Report).filter(
        models.Report.share_token == share_token,
        models.Report.is_public == True
    ).first()
    if not report:
        raise HTTPException(status_code=404, detail="Report not found or not public")

    content = None
    if report.content_path and os.path.exists(report.content_path):
        with open(report.content_path, "r", encoding="utf-8") as f:
            content = f.read()

    detail = schemas.ReportDetailResponse.from_orm(report)
    detail.content = content
    return detail


@router.post("/trend", response_model=schemas.TrendAnalysisResponse)
def trend_analysis(
    req: schemas.TrendAnalysisRequest,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    reports = db.query(models.Report).filter(
        models.Report.id.in_(req.report_ids),
        models.Report.user_id == current_user.id,
        models.Report.status == models.ReportStatus.COMPLETED
    ).all()
    if len(reports) < 2:
        raise HTTPException(status_code=400, detail="At least 2 completed reports required")

    contents = []
    for r in reports:
        if r.content_path and os.path.exists(r.content_path):
            with open(r.content_path, "r", encoding="utf-8") as f:
                contents.append(f"# {r.title}\n{f.read()[:1000]}")

    combined = "\n\n---\n\n".join(contents)
    prompt = f"请对以下多份报告进行趋势对比分析，提炼关键变化、增长/下降趋势、风险演变及未来预测。报告内容如下：\n\n{combined}"
    try:
        analysis = generate_report_content(prompt, None)
    except RuntimeError as e:
        raise HTTPException(status_code=400, detail=str(e))

    return schemas.TrendAnalysisResponse(
        analysis=analysis,
        report_ids=req.report_ids,
        created_at=datetime.now()
    )
