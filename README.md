# CUTRIX 裁剪车间管理系统

一个基于 Go + React Web 的现代化裁剪车间管理系统，实现了从生产计划下达到裁剪打包完成的全流程数字化追踪。

## 🏗️ 技术架构

系统围绕**计划与执行分离**的核心原则设计，确保数据的清晰与准确。

- **计划层 (`Production_Tasks`)**: 管理层下达的生产指令，定义了“应该做什么”。
- **执行层 (`Production_Logs`)**: 工人实际操作的记录，是“实际发生了什么”的唯一真实来源。


### 后端 (Backend)
- **语言**: Go 1.24+
- **Web框架**: Gin
- **数据库**: PostgreSQL 15
- **数据库驱动**: pgx + sqlx
- **配置管理**: Viper
- **容器化**: Docker

### 前端 (Frontend)
- **框架**: React 18 + TypeScript
- **构建工具**: Vite
- **UI组件库**: Ant Design
- **状态管理**: Zustand
- **网络请求**: Axios
- **路由**: React Router Dom

### 部署方案
- **开发环境**: Docker Compose + 前端开发服务器
- **生产环境**: Go 后端直接托管静态文件
- **数据库**: PostgreSQL 15 容器化部署

## 🚀 快速开始

### 环境要求
- Node.js 18+
- Docker & Docker Compose
- Git

### 安装步骤

1. **克隆项目**
   ```bash
   git clone <your-repo-url>
   cd CUTRIX
   ```

2. **一键构建和启动**
   
   **Windows:**
   ```cmd
   build.bat
   ```
   
   **Linux/macOS:**
   ```bash
   chmod +x build.sh
   ./build.sh
   ```

3. **访问应用**
   - 应用地址: http://localhost:8080
   - API 健康检查: http://localhost:8080/health

### 开发模式
如果需要同时开发前后端，推荐使用开发模式，支持热重载。

Windows: build.bat dev
Linux/macOS: ./build.sh dev

前端开发服务器: http://localhost:3000

后端 API: http://localhost:8080


### 数据库管理
我们提供了便捷的数据库管理脚本 db.bat (Windows) 和 db.sh (Linux/macOS)。

Bash

# 查看数据库状态、表结构和数据统计
./db.sh status

# 连接到 psql 命令行
./db.sh connect

# 重置数据库 (清空所有数据并保留结构)
./db.sh reset

# 插入预设的测试数据
./db.sh seed


## 📁 项目结构

```
CUTRIX/
├── backend/                 # Go 后端服务
│   ├── cmd/main.go         # 应用入口
│   ├── internal/           # 业务逻辑
│   │   ├── handlers/       # HTTP 处理器
│   │   │   ├── fabric_log_worker_handlers.go  # 布匹/日志/员工处理器
│   │   │   ├── order_handler.go              # 订单处理器
│   │   │   ├── style_handler.go              # 款号处理器
│   │   │   └── task_handler.go               # 任务处理器
│   │   ├── services/       # 业务服务
│   │   │   ├── fabric_log_worker_services.go # 布匹/日志/员工服务
│   │   │   ├── order_service.go              # 订单服务
│   │   │   ├── style_service.go              # 款号服务
│   │   │   └── task_service.go               # 任务服务
│   │   ├── repositories/   # 数据访问层
│   │   ├── models/         # 数据模型
│   │   └── config/         # 配置管理
│   ├── pkg/               # 公共包
│   │   ├── database/      # 数据库连接
│   │   └── middleware/    # 中间件
│   ├── migrations/        # 数据库迁移
│   └── web/              # 静态文件目录（构建时创建）
├── web-frontend/          # React Web 前端
│   ├── src/
│   │   ├── components/    # React 组件
│   │   ├── pages/         # 页面组件
│   │   ├── services/      # API 服务
│   │   ├── store/         # 状态管理
│   │   └── types/         # TypeScript 类型
│   ├── package.json
│   └── vite.config.ts
├── docker-compose.yml     # 开发环境配置
├── build.sh / build.bat   # 构建脚本
└── README.md
```

## 🔧 常用命令

```bash
# 构建并启动整个应用
npm run build

# 开发模式（前后端同时启动）
npm run dev

# 只启动后端
npm run dev:backend

# 只启动前端
npm run dev:frontend

# 启动 Docker 服务
npm run docker:up

# 停止 Docker 服务
npm run docker:down

# 查看后端日志
npm run docker:logs

# 清理构建文件
npm run clean
```

## 📊 核心功能

### 已实现
- ✅ **款号管理** - 创建和查看款号
- ✅ **生产任务管理** - 创建任务，实时进度追踪
- ✅ **数据库触发器** - 自动更新完成层数
- ✅ **静态文件托管** - Go 后端直接服务前端
- ✅ **响应式 UI** - 基于 Ant Design 的现代界面

### 开发中
- 🚧 **布匹管理** - 布匹注册和状态追踪
- 🚧 **生产记录** - 详细的操作日志
- 🚧 **员工管理** - 员工信息和任务分配

## 🔄 升级路径 - 从当前架构到高性能架构

当业务发展到需要更高性能时，可以按以下路径升级：

### 第一阶段：当前架构（适合日访问量 < 10万）
```
浏览器 → Go 后端 (8080) → PostgreSQL
         ├── /api/*  → REST API  
         └── /*      → 静态文件
```

**优势**: 部署简单、维护成本低
**适用**: 中小型团队、快速原型

### 第二阶段：独立 Web 服务器（适合日访问量 10万+）
```
浏览器 → Nginx (80/443)
         ├── /api/*  → Go 后端 (8080)
         └── /*      → 静态文件目录
```

**升级步骤**:
1. 安装 Nginx
2. 配置反向代理
3. 将静态文件部署到 Nginx 目录
4. 前端代码无需修改

**Nginx 配置示例**:
```nginx
server {
    listen 80;
    
    # 静态文件
    location / {
        root /var/www/cutrix/dist;
        try_files $uri $uri/ /index.html;
    }
    
    # API 反向代理
    location /api/ {
        proxy_pass http://localhost:8080;
        proxy_set_header Host $host;
    }
}
```

### 第三阶段：微服务架构（适合大规模应用）
```
浏览器 → API 网关 → 多个 Go 微服务
                   ├── 用户服务
                   ├── 订单服务  
                   ├── 库存服务
                   └── 日志服务
```

**升级要点**:
- 按业务域拆分服务
- 引入消息队列
- 实现分布式链路追踪

## 🔧 API 端点
基础URL: http://localhost:8080/api

认证: POST /api/auth/login

款号: GET, POST /api/styles, GET /api/styles/:id

订单: GET, POST /api/orders, GET /api/orders/:id

任务: GET, POST /api/tasks, GET /api/tasks/:id, GET /api/tasks/progress

布匹: GET, POST /api/fabric-rolls, GET /api/fabric-rolls/:id

日志: GET, POST /api/production-logs

员工: GET, POST, PUT, DELETE /api/workers, GET /api/workers/:id/tasks

## 🗄️  数据库设计与核心业务逻辑
系统基于6张核心表构建：

Styles: 产品款号定义。

Order_Details: 原始订单需求。

Production_Tasks: 生产任务，包含计划层数和实际完成层数。

Fabric_Rolls: 布匹物料，每匹布都有唯一ID ([款号]-[颜色]-[序号])。

Production_Logs: 操作的唯一真实来源 (Single Source of Truth)，记录放料、拉布、裁剪、打包等所有操作。

Workers: 员工信息。

关键业务流与自动化机制
计划: 管理员创建 Styles -> 录入 Order_Details -> 下达 Production_Tasks。

物料准备: 注册 Fabric_Rolls，系统自动生成唯一ID。

执行与追踪:

当工人完成拉布操作并提交 Production_Logs 记录时，数据库触发器 trg_after_spreading_log_insert 会自动更新 Production_Tasks 表中对应任务的 completed_layers 字段。

严禁在应用代码中手动修改 completed_layers。所有进度更新都源于 Production_Logs 的插入。

裁剪、打包等后续工序通过 parent_log_id 形成追踪链。


## 🐛 故障排除

### 常见问题

1. **端口被占用**
   ```bash
   # 检查端口占用
   netstat -tlnp | grep 8080
   # 修改 docker-compose.yml 中的端口映射
   ```

2. **前端构建失败**
   ```bash
   # 清理依赖重新安装
   cd web-frontend
   rm -rf node_modules package-lock.json
   npm install
   ```

3. **数据库连接失败**
   ```bash
   # 检查 Docker 服务状态
   docker-compose ps
   # 查看数据库日志
   docker-compose logs postgres
   ```