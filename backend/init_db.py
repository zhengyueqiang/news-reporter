"""
独立脚本：初始化数据库表结构并创建默认超级管理员。
用法：python init_db.py
"""
import sys
sys.path.insert(0, ".")

from app.database import engine, Base
from app.utils.seed import init_default_admin

if __name__ == "__main__":
    print("[InitDB] Creating database tables...")
    Base.metadata.create_all(bind=engine)
    print("[InitDB] Tables created.")

    print("[InitDB] Initializing default admin...")
    init_default_admin()
    print("[InitDB] Done.")
