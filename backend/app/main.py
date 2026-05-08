from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.database import engine, Base
from app.routers import auth, queries, reports, admin, system, schedules
from app.utils.seed import init_default_admin
from app.scheduler import start_scheduler

Base.metadata.create_all(bind=engine)
init_default_admin()

app = FastAPI(
    title="MiQroNews API",
    description="支持自然语言查询、LLM 生成报告、趋势分析与共享的企业情报平台",
    version="0.1.0"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://127.0.0.1:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router, prefix="/api/auth", tags=["认证"])
app.include_router(queries.router, prefix="/api/queries", tags=["查询"])
app.include_router(reports.router, prefix="/api/reports", tags=["报告"])
app.include_router(schedules.router, prefix="/api/schedules", tags=["计划"])
app.include_router(admin.router, prefix="/api/admin", tags=["管理"])
app.include_router(system.router, prefix="/api/system", tags=["系统配置"])

start_scheduler()


@app.get("/api/health", tags=["健康检查"])
def health_check():
    return {"status": "ok"}
