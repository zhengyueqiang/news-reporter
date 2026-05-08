---
name: fix-register-approval-config
overview: 修复 pydantic-settings v2 配置不兼容导致 .env 中 REGISTER_REQUIRES_APPROVAL=true 未生效的问题，使新用户注册后需审核才能登录。
design:
  architecture:
    framework: react
    component: mui
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
  - id: fix-config-env-loading
    content: 修复 config.py：将 pydantic v1 的 class Config 改为 v2 的 SettingsConfigDict
    status: pending
  - id: verify-register-approval
    content: 验证修复：确认 .env 中 REGISTER_REQUIRES_APPROVAL=true 生效，新注册用户状态为 PENDING
    status: pending
    dependencies:
      - fix-config-env-loading
---

## 问题描述

用户反馈：新用户注册后没有经过审核就可以直接登录系统。

## 问题根因

`backend/app/config.py` 中的 `BaseSettings` 配置使用了 pydantic v1 的写法（`class Config: env_file = ".env"`），但项目实际依赖的是 `pydantic==2.9.2` 和 `pydantic-settings==2.6.1`（v2 版本）。在 pydantic-settings v2 中，这种旧写法导致 `.env` 文件未被正确加载，使得 `.env` 中配置的 `REGISTER_REQUIRES_APPROVAL=true` 没有生效，回退到了默认值 `False`。注册逻辑在 `False` 时直接将新用户状态设为 `ACTIVE`，因此无需审核即可登录。

## 修复目标

修复 `config.py` 中 pydantic v2 的配置方式，确保 `.env` 文件能被正确加载，注册审核配置生效。

## 技术栈

- 后端：FastAPI + SQLAlchemy + pydantic v2 + pydantic-settings v2
- 前端：React + TypeScript + Tailwind CSS

## 实现方案

### 核心改动

修改 `backend/app/config.py`，将 pydantic v1 的 `class Config` 写法替换为 pydantic v2 标准的 `SettingsConfigDict` 配置方式。

### 具体变更

- 导入 `SettingsConfigDict`：`from pydantic_settings import BaseSettings, SettingsConfigDict`
- 删除内部的 `class Config: env_file = ".env"` 
- 添加类属性：`model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8")`

### 验证逻辑

修复后，`get_settings()` 返回的 `REGISTER_REQUIRES_APPROVAL` 将从 `.env` 文件中读取到 `True`，注册接口会将新用户状态设为 `PENDING`，登录接口会拦截 `PENDING` 状态用户并返回"账号正在审核中"的提示。