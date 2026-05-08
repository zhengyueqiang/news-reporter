# MiQroNews Intelligence Platform

<p align="center">
  <strong>Enterprise intelligence platform powered by LLM and real-time web search.</strong>
</p>

<p align="center">
  <a href="#-chinese-introduction">中文</a> | <a href="#-english-introduction">English</a>
</p>

---

## 📖 Chinese Introduction

MiQroNews 是一款基于大语言模型（LLM）与实时网络搜索的企业情报分析平台。用户只需输入关注主题，系统即可自动抓取最新网络资讯并生成结构化的情报分析报告。

### ✨ 核心特性

- **🤖 LLM 智能报告生成** — 支持 DeepSeek / OpenAI / Claude / Kimi 等多家模型服务商
- **🔍 实时网络搜索** — 集成 SerpAPI (Google) 和 Bing Search API，确保报告基于最新公开信息
- **📊 趋势对比分析** — 对多份历史报告进行趋势演变、风险变化、增长预测等维度的对比分析
- **📅 定时报告任务** — 支持按日、周、月、年自动生成并投递报告
- **🔗 报告公开共享** — 一键生成分享链接，支持外部分享与查阅
- **👥 用户权限管理** — 支持注册审批、管理员审核、用户状态管理
- **⚙️ 系统动态配置** — LLM 和搜索引擎配置均可在管理后台实时调整，无需重启服务

### 🛠 技术栈

| 层级 | 技术 |
|------|------|
| 后端 | Python, FastAPI, SQLAlchemy, PyMySQL, APScheduler |
| 前端 | React 18, TypeScript, Vite, TailwindCSS, Axios, Recharts |
| AI / 搜索 | DeepSeek / OpenAI / Claude / Kimi, SerpAPI / Bing Search API |

### 🚀 快速开始

#### 1. 克隆项目

```bash
git clone https://github.com/zhengyueqiang/news-reporter.git
cd news-reporter
```

#### 2. 启动后端

```bash
cd backend

# 创建虚拟环境（推荐）
python -m venv venv
venv\Scripts\activate   # Windows
# source venv/bin/activate  # macOS / Linux

# 安装依赖
pip install -r requirements.txt

# 配置环境变量（参考 .env.example 创建 .env）
cp .env.example .env
# 编辑 .env，设置 DATABASE_URL、SECRET_KEY、默认管理员账号等

# 初始化数据库（首次运行）
python init_db.py

# 启动服务
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

后端 API 文档：`http://localhost:8000/docs`

#### 3. 启动前端

```bash
cd frontend

# 安装依赖
npm install

# 启动开发服务器
npm run dev
```

前端地址：`http://localhost:5173`

#### 4. 配置 LLM 与搜索引擎

登录系统后进入 **系统管理** 页面：

- **LLM 配置**：填写服务商、模型名称、API Key
- **搜索引擎配置**：选择 SerpAPI 或 Bing，填写 API Key，使报告能够基于实时资讯生成

### 📁 项目结构

```
news-reporter/
├── backend/
│   ├── app/
│   │   ├── main.py              # FastAPI 入口
│   │   ├── models.py            # 数据库模型
│   │   ├── schemas.py           # Pydantic 数据校验
│   │   ├── config.py            # 应用配置
│   │   ├── database.py          # 数据库连接
│   │   ├── scheduler.py         # 定时任务调度
│   │   ├── routers/             # API 路由
│   │   ├── services/            # 业务逻辑（LLM、搜索、报告生成）
│   │   └── utils/               # 工具模块
│   ├── requirements.txt
│   └── .env.example
├── frontend/
│   ├── src/
│   │   ├── pages/               # 页面组件
│   │   ├── components/          # 公共组件
│   │   ├── context/             # React Context
│   │   └── api/                 # API 客户端
│   ├── package.json
│   └── vite.config.ts
└── README.md
```

### ⚠️ 安全提示

- 生产环境请务必修改 `.env` 中的 `SECRET_KEY` 和默认管理员密码。
- 不要将包含真实 API Key 的 `.env` 文件提交到 Git 仓库（已配置 `.gitignore`）。

---

## 📖 English Introduction

MiQroNews is an enterprise intelligence analysis platform powered by Large Language Models (LLM) and real-time web search. Users simply enter a topic of interest, and the system automatically crawls the latest web information to generate structured intelligence analysis reports.

### ✨ Key Features

- **🤖 LLM-powered Report Generation** — Supports DeepSeek, OpenAI, Claude, and Kimi
- **🔍 Real-time Web Search** — Integrates SerpAPI (Google) and Bing Search API to ensure reports are based on the latest public information
- **📊 Trend Comparative Analysis** — Compare multiple historical reports across trend evolution, risk changes, and growth predictions
- **📅 Scheduled Report Tasks** — Auto-generate and deliver reports by day, week, month, or year
- **🔗 Public Report Sharing** — One-click shareable links for external access
- **👥 User Access Management** — Registration approval, admin review, and user status management
- **⚙️ Dynamic System Configuration** — LLM and search engine settings can be adjusted in real-time from the admin dashboard without restarting the service

### 🛠 Tech Stack

| Layer | Technology |
|------|------------|
| Backend | Python, FastAPI, SQLAlchemy, PyMySQL, APScheduler |
| Frontend | React 18, TypeScript, Vite, TailwindCSS, Axios, Recharts |
| AI / Search | DeepSeek / OpenAI / Claude / Kimi, SerpAPI / Bing Search API |

### 🚀 Quick Start

#### 1. Clone the project

```bash
git clone https://github.com/zhengyueqiang/news-reporter.git
cd news-reporter
```

#### 2. Start the backend

```bash
cd backend

# Create virtual environment (recommended)
python -m venv venv
venv\Scripts\activate   # Windows
# source venv/bin/activate  # macOS / Linux

# Install dependencies
pip install -r requirements.txt

# Configure environment variables (create .env from .env.example)
cp .env.example .env
# Edit .env to set DATABASE_URL, SECRET_KEY, default admin credentials, etc.

# Initialize database (first run only)
python init_db.py

# Start the server
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

Backend API docs: `http://localhost:8000/docs`

#### 3. Start the frontend

```bash
cd frontend

# Install dependencies
npm install

# Start development server
npm run dev
```

Frontend URL: `http://localhost:5173`

#### 4. Configure LLM and Search Engine

After logging in, go to the **System Admin** page:

- **LLM Config**: Fill in provider, model name, and API Key
- **Search Engine Config**: Choose SerpAPI or Bing, enter the API Key so reports can be generated based on real-time information

### 📁 Project Structure

```
news-reporter/
├── backend/
│   ├── app/
│   │   ├── main.py              # FastAPI entry
│   │   ├── models.py            # Database models
│   │   ├── schemas.py           # Pydantic schemas
│   │   ├── config.py            # App configuration
│   │   ├── database.py          # DB connection
│   │   ├── scheduler.py         # Scheduled tasks
│   │   ├── routers/             # API routes
│   │   ├── services/            # Business logic (LLM, search, report generation)
│   │   └── utils/               # Utility modules
│   ├── requirements.txt
│   └── .env.example
├── frontend/
│   ├── src/
│   │   ├── pages/               # Page components
│   │   ├── components/          # Shared components
│   │   ├── context/             # React Context
│   │   └── api/                 # API client
│   ├── package.json
│   └── vite.config.ts
└── README.md
```

### ⚠️ Security Notice

- In production, be sure to change the `SECRET_KEY` and default admin password in `.env`.
- Never commit a `.env` file containing real API keys to Git (already configured in `.gitignore`).

---

<p align="center">
  Made with ❤️ by MiQroNews Team
</p>
