# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

CUTRIX is a modern cutting workshop management system that implements full digital tracking from production planning to cutting and packaging completion. The system is built with Go + React Web technology stack and designed around the core principle of separating planning from execution tracking.

### Core Architecture

**Backend (Go)**
- Framework: Gin web framework
- Database: PostgreSQL 15 with sqlx + lib/pq drivers
- Configuration: Viper for config management
- Structure: Clean architecture with handlers -> services -> repositories pattern

**Frontend (React)**
- Framework: React 18 + TypeScript
- Build Tool: Vite
- UI Library: Ant Design
- State Management: Zustand
- HTTP Client: Axios

**Database Design Philosophy**
- 6 core tables following strict separation of "plan vs execution"
- `Production_Tasks` defines what should be done (planning)
- `Production_Logs` records what actually happened (execution)
- Database triggers automatically sync actual completion data
- Fabric rolls have unique IDs for precise material tracking

## Development Commands

### 🚀 一键启动脚本（推荐）

**Windows:**
```bash
# 正常构建启动
build.bat

# 开发模式（跳过前端构建，适合前端开发）
build.bat dev

# 完全清理重构建（删除所有容器和卷）
build.bat clean

# 重置数据库（仅删除数据库数据，适合数据库结构变更时）
build.bat reset

# 查看服务日志
build.bat logs

# 停止所有服务
build.bat stop
```

**Linux/macOS:**
```bash
# 首次运行需要添加执行权限
chmod +x build.sh

# 正常构建启动
./build.sh

# 开发模式
./build.sh dev

# 完全清理重构建
./build.sh clean

# 重置数据库
./build.sh reset

# 查看服务日志
./build.sh logs

# 停止所有服务
./build.sh stop
```

### 🗃️ 数据库管理工具

**Windows:**
```bash
# 查看数据库状态和表结构
db.bat status

# 连接到数据库（psql命令行）
db.bat connect

# 备份数据库
db.bat backup

# 恢复数据库
db.bat restore

# 重置数据库（清空所有数据）
db.bat reset

# 插入测试数据
db.bat seed

# 手动运行迁移脚本
db.bat migrate
```

**Linux/macOS:**
```bash
# 添加执行权限
chmod +x db.sh

# 使用方法同Windows，将db.bat替换为./db.sh
./db.sh status
./db.sh connect
# ... 等等
```

### 传统方式（Manual Setup）
```bash
# Windows
build.bat

# Linux/macOS  
./build.sh

# Manual setup
cd web-frontend && npm install && npm run build
docker-compose up -d
```

### Development Mode
```bash
# Start both frontend and backend in dev mode
npm run dev

# Start only backend (with database)
npm run dev:backend
# or manually:
cd backend && docker-compose up

# Start only frontend dev server
npm run dev:frontend
# or manually:
cd web-frontend && npm run dev
```

### Build and Deployment
```bash
# Build frontend and copy to backend/web/dist
npm run build
cd web-frontend && npm run build

# Docker operations
npm run docker:up
npm run docker:down
npm run docker:logs

# Frontend linting
cd web-frontend && npm run lint
```

### Backend Operations
```bash
# Run backend directly (requires PostgreSQL running)
cd backend && go run cmd/main.go

# Database migrations are handled automatically on startup
# Migration files: backend/migrations/
```

## Key File Locations

### Backend Structure
- Entry point: `backend/cmd/main.go`
- Business logic: `backend/internal/`
  - `handlers/` - HTTP request handlers
  - `services/` - Business logic layer
  - `repositories/` - Data access layer
  - `models/` - Data structures and request/response models
- Database: `backend/pkg/database/` and `backend/migrations/`
- Static files served from: `backend/web/dist/` (auto-created during build)

### Frontend Structure
- Entry point: `web-frontend/src/main.tsx`
- Main app: `web-frontend/src/App.tsx`
- Pages: `web-frontend/src/pages/`
- Components: `web-frontend/src/components/`
- API services: `web-frontend/src/services/`
- State management: `web-frontend/src/store/`
- TypeScript types: `web-frontend/src/types/`

## Core Business Logic

### Database Schema (6 Core Tables)
1. **Styles** - Product style definitions (款号)
2. **Order_Details** - Original order requirements by color
3. **Production_Tasks** - Management-issued work instructions (计划层数 + 实际完成层数)
4. **Fabric_Rolls** - Physical material tracking with unique IDs
5. **Production_Logs** - Single source of truth for all operations (放料/拉布/裁剪/打包)
6. **Workers** - Employee information

### Critical Business Flow
1. **Planning Phase**: Create styles → input orders → issue production tasks
2. **Material Prep**: Register fabric rolls with generated IDs (format: `[style]-[color]-[seq]`)
3. **Spreading Execution**: Workers complete spreading, system auto-updates `completed_layers` via database trigger
4. **Process Tracking**: Cutting/packing operations linked via `parent_log_id` chains

### Auto-Sync Mechanism
- Database trigger `trg_after_spreading_log_insert` automatically updates `Production_Tasks.completed_layers`
- Never manually update `completed_layers` in application code
- All progress tracking is derived from `Production_Logs` insertions

## Development Guidelines

### Backend Development
- Follow the handler → service → repository pattern
- Use `sqlx` for database operations with raw SQL
- All database models are in `internal/models/models.go`
- Validation using `go-playground/validator`
- API responses follow standard `APIResponse` structure

### Frontend Development
- Use Ant Design components consistently
- State management with Zustand stores
- API calls through centralized service layer
- TypeScript interfaces in `src/types/`

### Database Development
- Never bypass database triggers
- Fabric roll ID generation is application responsibility
- Use parameterized queries for all database operations
- Migrations are in `backend/migrations/` and run automatically

## API Endpoints

Base URL: `http://localhost:8080/api`

- **Styles**: `POST /styles`, `GET /styles`, `GET /styles/:id`
- **Orders**: `POST /orders`, `GET /orders`, `GET /orders/:id`
- **Tasks**: `POST /tasks`, `GET /tasks`, `GET /tasks/:id`, `GET /tasks/progress`
- **Fabric Rolls**: `POST /fabric-rolls`, `GET /fabric-rolls`, `GET /fabric-rolls/:id`
- **Production Logs**: `POST /production-logs`, `GET /production-logs`
- **Workers**: `GET /workers`, `GET /workers/:id/tasks`

## Production Deployment

The system uses a single Go binary that serves both API and static files:
- Frontend builds to `backend/web/dist/`
- Go backend serves static files from `/` and API from `/api/*`
- Production URL: `http://localhost:8080`
- Health check: `http://localhost:8080/health`

## Troubleshooting

### Port Conflicts
- Backend runs on `:8080`, frontend dev server on `:3000`
- Database runs on `:5432` (PostgreSQL)
- Check `docker-compose.yml` for port mappings

### Build Issues
- Frontend build outputs to `backend/web/dist/`
- Clean build: `npm run clean` then rebuild
- Ensure Node.js 18+ is installed

### Database Issues
- Database auto-migrates on backend startup
- Check logs: `npm run docker:logs`
- Sample data is automatically inserted via migration