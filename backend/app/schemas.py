from pydantic import BaseModel, EmailStr
from datetime import datetime
from typing import Optional, List
from app.models import UserStatus, ReportPeriod, ReportStatus


class UserBase(BaseModel):
    username: str
    email: EmailStr


class UserCreate(UserBase):
    password: str


class UserResponse(UserBase):
    id: int
    is_admin: bool
    status: UserStatus
    created_at: datetime

    class Config:
        from_attributes = True


class UserCreateByAdmin(UserBase):
    password: str
    is_admin: bool = False
    status: UserStatus = UserStatus.ACTIVE


class UserUpdate(BaseModel):
    username: Optional[str] = None
    email: Optional[str] = None
    is_admin: Optional[bool] = None
    status: Optional[UserStatus] = None


class ResetPasswordResponse(BaseModel):
    new_password: str


class PaginatedUserResponse(BaseModel):
    items: List[UserResponse]
    total: int
    page: int
    page_size: int
    total_pages: int


class UserLogin(BaseModel):
    username: str
    password: str


class Token(BaseModel):
    access_token: str
    refresh_token: str
    token_type: str = "bearer"
    user: UserResponse


class QueryCreate(BaseModel):
    topic: str


class QueryResponse(BaseModel):
    id: int
    user_id: int
    topic: str
    created_at: datetime

    class Config:
        from_attributes = True


class ReportBase(BaseModel):
    title: str
    period: Optional[ReportPeriod] = None


class ReportCreate(ReportBase):
    query_id: Optional[int] = None


class ReportResponse(ReportBase):
    id: int
    user_id: int
    query_id: Optional[int]
    schedule_id: Optional[int]
    status: ReportStatus
    is_public: bool
    share_token: Optional[str]
    summary: Optional[str]
    created_at: datetime
    updated_at: Optional[datetime]

    class Config:
        from_attributes = True


class ReportDetailResponse(ReportResponse):
    content: Optional[str] = None


class ReportUpdate(BaseModel):
    is_public: Optional[bool] = None
    title: Optional[str] = None


class SystemConfigBase(BaseModel):
    key: str
    value: Optional[str] = None
    description: Optional[str] = None


class SystemConfigResponse(SystemConfigBase):
    id: int
    updated_at: Optional[datetime]

    class Config:
        from_attributes = True


class LLMConfigUpdate(BaseModel):
    provider: str
    api_key: str
    model: str


class SearchConfigUpdate(BaseModel):
    engine: str
    api_key: str


class TrendAnalysisRequest(BaseModel):
    report_ids: List[int]
    topic: Optional[str] = None


class TrendAnalysisResponse(BaseModel):
    analysis: str
    report_ids: List[int]
    created_at: datetime


class ReportScheduleBase(BaseModel):
    title: str
    period: ReportPeriod
    is_active: bool = True


class ReportScheduleCreate(ReportScheduleBase):
    query_id: Optional[int] = None


class ReportScheduleResponse(ReportScheduleBase):
    id: int
    user_id: int
    query_id: Optional[int]
    next_run_at: datetime
    last_run_at: Optional[datetime]
    created_at: datetime
    updated_at: Optional[datetime]

    class Config:
        from_attributes = True


class ReportScheduleUpdate(BaseModel):
    is_active: Optional[bool] = None
