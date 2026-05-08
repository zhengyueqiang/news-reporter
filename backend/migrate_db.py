"""
数据库迁移脚本：添加 report_schedules 表和 reports.schedule_id 列
用法：python migrate_db.py
"""
import sys
sys.path.insert(0, ".")

from sqlalchemy import inspect, text
from app.database import engine, Base
from app import models

def column_exists(table_name, column_name):
    inspector = inspect(engine)
    columns = [c["name"] for c in inspector.get_columns(table_name)]
    return column_name in columns

def table_exists(table_name):
    inspector = inspect(engine)
    return table_name in inspector.get_table_names()

if __name__ == "__main__":
    # Create new tables (report_schedules)
    print("[Migrate] Creating new tables if not exist...")
    Base.metadata.create_all(bind=engine)

    # Add schedule_id column to reports if not exists
    if not column_exists("reports", "schedule_id"):
        print("[Migrate] Adding schedule_id column to reports...")
        with engine.connect() as conn:
            conn.execute(text("ALTER TABLE reports ADD COLUMN schedule_id INT NULL"))
            conn.commit()
        print("[Migrate] Column added.")
    else:
        print("[Migrate] schedule_id column already exists.")

    print("[Migrate] Done.")
