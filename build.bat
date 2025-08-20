@echo off
REM CUTRIX Project Build Script (Windows)
REM 使用方法:
REM   build.bat          - 正常构建启动
REM   build.bat clean    - 清理并重新构建（删除所有容器和卷）
REM   build.bat dev      - 开发模式启动
REM   build.bat reset    - 重置数据库（仅删除数据库卷）
REM   build.bat logs     - 查看日志
REM   build.bat stop     - 停止所有服务

setlocal enabledelayedexpansion

REM 解析命令行参数
set "command=%1"
if "%command%"=="" set "command=normal"

echo ========================================
echo CUTRIX 裁剪车间管理系统构建脚本
echo ========================================

REM 检查命令行参数
if "%command%"=="clean" goto :clean_build
if "%command%"=="dev" goto :dev_mode
if "%command%"=="reset" goto :reset_db
if "%command%"=="logs" goto :show_logs
if "%command%"=="stop" goto :stop_services
if "%command%"=="normal" goto :normal_build

echo 未知命令: %command%
echo.
echo 可用命令:
echo   build.bat          - 正常构建启动
echo   build.bat clean    - 清理并重新构建（删除所有容器和卷）
echo   build.bat dev      - 开发模式启动
echo   build.bat reset    - 重置数据库（仅删除数据库卷）
echo   build.bat logs     - 查看日志
echo   build.bat stop     - 停止所有服务
pause
exit /b 1

:normal_build
echo [信息] 执行正常构建启动...
goto :build_frontend

:clean_build
echo [信息] 执行完全清理构建...
echo [警告] 这将删除所有Docker容器、卷和镜像，包括数据库数据！
set /p confirm="确认继续？(y/N): "
if /i not "%confirm%"=="y" (
    echo 操作已取消
    pause
    exit /b 0
)

echo [信息] 停止并删除所有相关容器...
docker-compose down
echo [信息] 删除所有卷（包括数据库数据）...
docker-compose down -v
echo [信息] 清理未使用的Docker资源...
docker system prune -f
goto :build_frontend

:dev_mode
echo [信息] 开发模式启动...
echo [信息] 跳过前端构建，仅启动后端服务和数据库...
goto :start_services

:reset_db
echo [信息] 重置数据库...
echo [警告] 这将删除所有数据库数据！
set /p confirm="确认重置数据库？(y/N): "
if /i not "%confirm%"=="y" (
    echo 操作已取消
    pause
    exit /b 0
)

echo [信息] 停止服务...
docker-compose stop postgres
echo [信息] 删除数据库卷...
docker volume rm cutrix_postgres_data 2>nul
echo [信息] 重新启动服务...
docker-compose up -d postgres
timeout /t 5 /nobreak >nul
docker-compose up -d backend
echo [信息] 数据库重置完成！新的数据库将自动运行迁移脚本。
goto :show_status

:show_logs
echo [信息] 显示服务日志...
docker-compose logs -f
goto :end

:stop_services
echo [信息] 停止所有服务...
docker-compose stop
echo [信息] 所有服务已停止
goto :end

:build_frontend
REM 检查必要工具
echo [检查] 验证开发环境...

where node >nul 2>nul
if %errorlevel% neq 0 (
    echo [错误] 未找到 Node.js，请先安装 Node.js
    echo 下载地址: https://nodejs.org/
    pause
    exit /b 1
)

where npm >nul 2>nul
if %errorlevel% neq 0 (
    echo [错误] 未找到 npm，请先安装 npm
    pause
    exit /b 1
)

where docker >nul 2>nul
if %errorlevel% neq 0 (
    echo [错误] 未找到 Docker，请先安装 Docker Desktop
    echo 下载地址: https://www.docker.com/products/docker-desktop
    pause
    exit /b 1
)

echo [信息] 开发环境检查通过 ✓

if "%command%"=="dev" goto :start_services

echo [构建] 安装前端依赖...
cd web-frontend
if not exist node_modules (
    call npm install
    if !errorlevel! neq 0 (
        echo [错误] npm install 失败
        cd ..
        pause
        exit /b 1
    )
) else (
    echo [信息] node_modules 已存在，跳过安装（如需重新安装请删除 node_modules 文件夹）
)

echo [构建] 构建前端项目...
call npm run build
if !errorlevel! neq 0 (
    echo [错误] 前端构建失败
    cd ..
    pause
    exit /b 1
)

echo [信息] 前端构建完成 ✓ 静态文件已输出到 backend/web/dist/
cd ..

:start_services
echo [Docker] 启动Docker服务...

REM 检查是否已有运行的容器
docker-compose ps | findstr "Up" >nul
if %errorlevel% equ 0 (
    echo [信息] 检测到运行中的服务，正在重启...
    docker-compose down
    timeout /t 2 /nobreak >nul
)

echo [Docker] 启动所有服务...
docker-compose up -d
if %errorlevel% neq 0 (
    echo [错误] Docker服务启动失败
    echo [提示] 请检查：
    echo   1. Docker Desktop 是否正在运行
    echo   2. 端口 8080, 5432, 6379 是否被其他程序占用
    echo   3. docker-compose.yml 配置是否正确
    pause
    exit /b 1
)

echo [等待] 等待服务启动...
timeout /t 10 /nobreak >nul

:show_status
echo.
echo ========================================
echo         🎉 CUTRIX 系统启动成功！
echo ========================================
echo.
echo 📊 服务状态:
docker-compose ps
echo.
echo 🌐 访问地址:
echo   应用首页:     http://localhost:8080
echo   API健康检查:  http://localhost:8080/health
echo   员工管理:     http://localhost:8080 (侧边栏)
echo.
echo 🔧 开发工具:
echo   查看日志:     docker-compose logs -f
echo   停止服务:     docker-compose stop
echo   重启服务:     docker-compose restart
echo.
echo 💡 快捷命令:
echo   build.bat logs    - 查看实时日志
echo   build.bat stop    - 停止所有服务  
echo   build.bat reset   - 重置数据库
echo   build.bat clean   - 完全重新构建
echo.

REM 健康检查
echo [检查] 验证服务健康状态...
timeout /t 5 /nobreak >nul
curl -s http://localhost:8080/health >nul 2>nul
if %errorlevel% equ 0 (
    echo [成功] ✓ 后端API服务正常
) else (
    echo [警告] ⚠ 后端API可能还在启动中，请稍后再试
    echo [信息] 如果持续失败，请运行: build.bat logs 查看日志
)

curl -s http://localhost:8080/ >nul 2>nul
if %errorlevel% equ 0 (
    echo [成功] ✓ 前端页面服务正常
) else (
    echo [警告] ⚠ 前端页面可能还在启动中，请稍后再试
)

echo.
echo 系统已就绪！按任意键退出...

:end
pause