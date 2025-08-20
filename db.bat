@echo off
REM CUTRIX Database Management Script (Windows)
REM 数据库管理便捷工具
REM 使用方法:
REM   db.bat status        - 查看数据库状态
REM   db.bat connect       - 连接到数据库（psql）
REM   db.bat backup        - 备份数据库
REM   db.bat restore       - 恢复数据库
REM   db.bat reset         - 重置数据库（清空所有数据）
REM   db.bat seed          - 插入测试数据
REM   db.bat migrate       - 手动运行迁移脚本

setlocal enabledelayedexpansion

set "command=%1"
if "%command%"=="" (
    echo CUTRIX 数据库管理工具
    echo.
    echo 可用命令:
    echo   db.bat status        - 查看数据库状态
    echo   db.bat connect       - 连接到数据库（psql）
    echo   db.bat backup        - 备份数据库
    echo   db.bat restore       - 恢复数据库
    echo   db.bat reset         - 重置数据库（清空所有数据）
    echo   db.bat seed          - 插入测试数据
    echo   db.bat migrate       - 手动运行迁移脚本
    pause
    exit /b 0
)

REM 检查Docker是否运行
docker ps > nul 2>&1
if %errorlevel% neq 0 (
    echo [错误] Docker未运行或无法连接，请先启动Docker
    pause
    exit /b 1
)

REM 检查postgres容器是否运行
docker-compose ps postgres | findstr "Up" > nul
if %errorlevel% neq 0 (
    echo [错误] PostgreSQL容器未运行，请先运行: build.bat
    pause
    exit /b 1
)

if "%command%"=="status" goto :status
if "%command%"=="connect" goto :connect
if "%command%"=="backup" goto :backup
if "%command%"=="restore" goto :restore
if "%command%"=="reset" goto :reset
if "%command%"=="seed" goto :seed
if "%command%"=="migrate" goto :migrate

echo 未知命令: %command%
pause
exit /b 1

:status
echo [信息] 数据库状态检查...
echo.
echo === Docker容器状态 ===
docker-compose ps postgres
echo.
echo === 数据库连接测试 ===
docker-compose exec postgres psql -U postgres -d cutrix -c "SELECT 'Database is accessible' as status;"
echo.
echo === 数据库表列表 ===
docker-compose exec postgres psql -U postgres -d cutrix -c "\dt"
echo.
echo === 数据统计 ===
docker-compose exec postgres psql -U postgres -d cutrix -c "SELECT 'styles' as table_name, COUNT(*) as count FROM styles UNION SELECT 'workers', COUNT(*) FROM workers UNION SELECT 'order_details', COUNT(*) FROM order_details UNION SELECT 'production_tasks', COUNT(*) FROM production_tasks UNION SELECT 'fabric_rolls', COUNT(*) FROM fabric_rolls UNION SELECT 'production_logs', COUNT(*) FROM production_logs;"
goto :end

:connect
echo [信息] 连接到数据库...
echo [提示] 输入 \q 退出数据库连接
echo.
docker-compose exec postgres psql -U postgres -d cutrix
goto :end

:backup
echo [信息] 备份数据库...
set timestamp=%date:~0,4%%date:~5,2%%date:~8,2%_%time:~0,2%%time:~3,2%%time:~6,2%
set timestamp=%timestamp: =0%
if not exist "backups" mkdir backups
echo [信息] 创建备份文件: backups\cutrix_backup_%timestamp%.sql
docker-compose exec postgres pg_dump -U postgres cutrix > backups\cutrix_backup_%timestamp%.sql
if %errorlevel% equ 0 (
    echo [成功] 数据库备份完成: backups\cutrix_backup_%timestamp%.sql
) else (
    echo [错误] 备份失败
)
goto :end

:restore
echo [信息] 恢复数据库...
if not exist "backups" (
    echo [错误] 没有找到backups文件夹
    goto :end
)
dir backups\*.sql
echo.
set /p filename="请输入要恢复的备份文件名（不含路径）: "
if not exist "backups\%filename%" (
    echo [错误] 文件不存在: backups\%filename%
    goto :end
)
echo [警告] 这将清空当前数据库并恢复为备份数据
set /p confirm="确认继续？(y/N): "
if /i not "%confirm%"=="y" (
    echo 操作已取消
    goto :end
)
echo [信息] 恢复数据库从: backups\%filename%
docker-compose exec -T postgres psql -U postgres -d cutrix < backups\%filename%
if %errorlevel% equ 0 (
    echo [成功] 数据库恢复完成
) else (
    echo [错误] 恢复失败
)
goto :end

:reset
echo [警告] 这将清空数据库所有数据！
set /p confirm="确认重置数据库？(y/N): "
if /i not "%confirm%"=="y" (
    echo 操作已取消
    goto :end
)
echo [信息] 清空所有表数据...
docker-compose exec postgres psql -U postgres -d cutrix -c "TRUNCATE TABLE production_logs, fabric_rolls, production_tasks, order_details, workers, styles RESTART IDENTITY CASCADE;"
echo [成功] 数据库已重置
goto :end

:seed
echo [信息] 插入测试数据...
docker-compose exec postgres psql -U postgres -d cutrix -c "
INSERT INTO styles (style_number) VALUES ('BEE3TS111'), ('BEE3TS112'), ('BEE3TS113') ON CONFLICT (style_number) DO NOTHING;
INSERT INTO workers (name) VALUES ('张三'), ('李四'), ('王五'), ('赵六'), ('钱七') ON CONFLICT (name) DO NOTHING;
INSERT INTO order_details (style_id, color, quantity) VALUES (1, '韩白', 100), (1, '黑色', 80), (2, '韩白', 120), (3, '红色', 60) ON CONFLICT DO NOTHING;
INSERT INTO production_tasks (style_id, marker_id, color, planned_layers) VALUES (1, '321.1', '韩白', 38), (1, '321.2', '黑色', 40), (2, '322.1', '韩白', 45) ON CONFLICT DO NOTHING;
"
echo [成功] 测试数据插入完成
goto :end

:migrate
echo [信息] 手动运行数据库迁移...
docker-compose exec postgres psql -U postgres -d cutrix -c "\i /docker-entrypoint-initdb.d/000001_initial_schema.up.sql"
if %errorlevel% equ 0 (
    echo [成功] 迁移脚本执行完成
) else (
    echo [警告] 迁移脚本可能已经执行过，或者执行失败
)
goto :end

:end
pause