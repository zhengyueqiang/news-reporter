import os
import uuid
from typing import Optional
from sqlalchemy.orm import Session
from app import models
from app.services.llm_service import generate_report_content
from app.services.search_service import search_news, format_search_results, is_search_enabled

REPORTS_DIR = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(__file__))), "reports_data")
os.makedirs(REPORTS_DIR, exist_ok=True)


def generate_and_save_report(
    db: Session,
    user_id: int,
    title: str,
    period: Optional[models.ReportPeriod],
    query_id: Optional[int] = None,
    schedule_id: Optional[int] = None,
) -> models.Report:
    """Create a report record, fetch latest news, generate content via LLM, save to file, and update status."""
    report = models.Report(
        user_id=user_id,
        query_id=query_id,
        schedule_id=schedule_id,
        title=title,
        period=period,
        status=models.ReportStatus.GENERATING,
    )
    db.add(report)
    db.commit()
    db.refresh(report)

    try:
        # Step 1: fetch real-time search results if enabled
        search_context = ""
        if is_search_enabled():
            try:
                results = search_news(title, period.value if period else None, num_results=10)
                search_context = format_search_results(results)
            except Exception as e:
                # Log but don't fail — fall back to pure LLM generation
                search_context = f"\n> ⚠️ 实时搜索失败：{str(e)}，以下内容由模型基于已有知识生成。\n"

        # Step 2: build prompt
        period_str = period.value if period else ""
        if schedule_id:
            prompt = (
                f"请针对主题「{title}」生成一份{period_str}情报分析报告，"
                f"重点关注该周期内的最新动态与变化。"
                f"报告应包含：行业概述、关键动态、主要参与者、风险与机遇、趋势预测。"
                f"请使用 Markdown 格式输出，结构清晰、内容详实。"
            )
            content = generate_report_content(
                title,
                period_str or None,
                custom_prompt=prompt,
                search_context=search_context,
            )
        else:
            content = generate_report_content(
                title,
                period_str or None,
                search_context=search_context,
            )

        filename = f"report_{report.id}_{uuid.uuid4().hex[:8]}.md"
        filepath = os.path.join(REPORTS_DIR, filename)
        with open(filepath, "w", encoding="utf-8") as f:
            f.write(content)

        report.status = models.ReportStatus.COMPLETED
        report.content_path = filepath
        report.summary = content[:200] + "..." if len(content) > 200 else content
        db.commit()
        db.refresh(report)
    except Exception:
        report.status = models.ReportStatus.FAILED
        db.commit()
        db.refresh(report)
        raise

    return report
