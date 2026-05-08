---
name: admin-user-management
overview: 在系统管理后台扩展完整的用户管理功能：后端新增创建/编辑/删除/重置密码接口，前端增加对应操作交互和弹窗。
design:
  architecture:
    framework: react
  styleKeywords:
    - Dark Theme
    - Card-based
    - Modal Dialog
    - Minimalist
    - Glassmorphism
  fontSystem:
    fontFamily: PingFang SC
    heading:
      size: 20px
      weight: 600
    subheading:
      size: 16px
      weight: 500
    body:
      size: 14px
      weight: 400
  colorSystem:
    primary:
      - "#6366F1"
      - "#818CF8"
    background:
      - "#0F172A"
      - "#1E293B"
      - "#334155"
    text:
      - "#F8FAFC"
      - "#CBD5E1"
      - "#94A3B8"
    functional:
      - "#22C55E"
      - "#EF4444"
      - "#F59E0B"
      - "#3B82F6"
todos:
  - id: backend-schemas
    content: 扩展 schemas.py：新增 UserCreateByAdmin、UserUpdate、ResetPasswordResponse
    status: completed
  - id: backend-admin-routes
    content: 扩展 admin.py：实现用户增删改查及重置密码接口
    status: completed
    dependencies:
      - backend-schemas
  - id: frontend-user-management
    content: 改造 Admin.tsx：用户列表增强、新增/编辑弹窗、重置密码与删除交互
    status: completed
---

## 用户管理功能增强

### 产品概述

在现有系统管理后台中，扩展用户管理模块，使管理员能够对用户进行完整的生命周期管理。

### 核心功能

- **用户列表查看**：展示所有用户信息（用户名、邮箱、状态、是否管理员、创建时间）
- **新增用户**：管理员填写表单创建新用户（含用户名、邮箱、密码、管理员权限）
- **编辑用户**：修改用户基本信息（用户名、邮箱、管理员权限）
- **删除用户**：移除指定用户（禁止删除自己）
- **重置密码**：系统生成随机密码并展示给管理员
- **审核注册**：保留现有功能，对待审核用户进行通过/拒绝操作

## Tech Stack

- **Backend**: Python + FastAPI + SQLAlchemy + Pydantic + bcrypt
- **Frontend**: React + TypeScript + Tailwind CSS
- **Auth**: JWT Bearer Token

## Implementation Approach

基于现有 `admin.py` 路由和 `Admin.tsx` 页面进行扩展。后端遵循已有模式：每个操作独立路由、统一权限校验（`get_current_admin`）、返回标准响应。前端保持现有暗色卡片风格，使用 React state 管理弹窗显隐和表单数据。

关键决策：

- **新增用户密码**：由管理员在表单中直接设置，后端使用现有 `get_password_hash` 进行 bcrypt 哈希
- **重置密码**：后端生成 12 位随机字母数字密码，哈希后入库，同时将明文密码通过 API 响应返回给管理员（仅展示一次）
- **编辑用户**：不暴露密码字段，仅编辑基础信息
- **安全校验**：禁止管理员删除或修改自己的账户；禁止将唯一管理员降为普通用户（可选兜底）

## Implementation Notes

- 复用现有 `get_password_hash`（`app/utils/security.py`）进行密码哈希，不引入新依赖
- 新增用户时 `status` 默认为 `active`，绕过审核流程
- 前端弹窗使用现有 Tailwind 样式（圆角卡片、暗色背景），保持与 LLM 配置面板一致
- 操作成功后刷新用户列表，保持数据同步

## Architecture Design

```
Frontend (Admin.tsx)
  ├── UserList (用户列表 + 搜索)
  ├── UserFormModal (新增/编辑弹窗)
  ├── ResetPasswordModal (重置密码结果展示)
  └── ConfirmDialog (删除确认)

Backend (admin.py)
  ├── GET /admin/users → list_users
  ├── POST /admin/users → create_user
  ├── PUT /admin/users/{id} → update_user
  ├── DELETE /admin/users/{id} → delete_user
  ├── PUT /admin/users/{id}/status → update_user_status (已有)
  └── POST /admin/users/{id}/reset-password → reset_password
```

## Directory Structure

```
backend/app/
├── routers/
│   └── admin.py              # [MODIFY] 新增 create_user / update_user / delete_user / reset_password 接口
├── schemas.py                # [MODIFY] 新增 UserCreateByAdmin, UserUpdate, ResetPasswordResponse schema
└── utils/
    └── security.py           # [已有] 复用 get_password_hash

frontend/src/
└── pages/
    └── Admin.tsx             # [MODIFY] 扩展用户管理面板：新增/编辑弹窗、删除确认、重置密码交互
```

## Key Code Structures

```python
# backend/app/schemas.py
class UserCreateByAdmin(UserBase):
    password: str
    is_admin: bool = False

class UserUpdate(BaseModel):
    username: Optional[str] = None
    email: Optional[EmailStr] = None
    is_admin: Optional[bool] = None

class ResetPasswordResponse(BaseModel):
    message: str
    new_password: str
```

## 设计概述

基于现有暗色主题系统管理页面进行扩展，保持视觉一致性。新增用户管理操作区域，采用弹窗交互模式，减少页面跳转。

## 页面布局

- **顶部统计卡片**：保留现有四格统计（总用户/总查询/总报告/待审核）
- **用户管理卡片**：
- 卡片头部：标题 + 搜索框 +「新增用户」按钮
- 用户列表表格/卡片：每行显示用户名、邮箱、角色标签、状态标签、操作按钮
- 操作按钮：编辑、重置密码、删除（自己隐藏操作按钮）
- **新增/编辑弹窗**：表单包含用户名、邮箱、密码（仅新增）、管理员开关
- **重置密码结果弹窗**：展示新生成的随机密码，支持一键复制
- **删除确认弹窗**：二次确认防止误删

## 交互设计

- 列表实时过滤搜索（前端本地过滤）
- 弹窗带遮罩层，点击遮罩或 ESC 可关闭
- 操作成功后 Toast 提示并刷新列表
- 重置密码结果弹窗提供复制按钮

## 响应式

- 桌面端：列表横向展开，操作按钮并排
- 移动端：列表项垂直堆叠，操作按钮收起到下拉菜单