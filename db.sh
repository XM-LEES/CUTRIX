#!/bin/bash
# CUTRIX Database Management Script (Linux/macOS)
# 数据库管理便捷工具
# 使用方法:
#   ./db.sh status        - 查看数据库状态
#   ./db.sh connect       - 连接到数据库（psql）
#   ./db.sh backup        - 备份数据库
#   ./db.sh restore       - 恢复数据库
#   ./db.sh reset         - 重置数据库（清空所有数据）
#   ./db.sh seed          - 插入测试数据
#   ./db.sh migrate       - 手动运行迁移脚本

set -e

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[0;33m'
BLUE='\033[0;34m'
NC='\033[0m'

COMMAND=${1:-help}

if [ "$COMMAND" = "help" ] || [ "$COMMAND" = "" ]; then
    echo -e "${BLUE}CUTRIX 数据库管理工具${NC}"
    echo ""
    echo "可用命令:"
    echo "  ./db.sh status        - 查看数据库状态"
    echo "  ./db.sh connect       - 连接到数据库（psql）"
    echo "  ./db.sh backup        - 备份数据库"
    echo "  ./db.sh restore       - 恢复数据库"
    echo "  ./db.sh reset         - 重置数据库（清空所有数据）"
    echo "  ./db.sh seed          - 插入测试数据"
    echo "  ./db.sh migrate       - 手动运行迁移脚本"
    exit 0
fi

# 检查Docker是否运行
if ! docker ps > /dev/null 2>&1; then
    echo -e "${RED}[错误] Docker未运行或无法连接，请先启动Docker${NC}"
    exit 1
fi

# 检查postgres容器是否运行
if ! docker-compose ps postgres | grep -q "Up"; then
    echo -e "${RED}[错误] PostgreSQL容器未运行，请先运行: ./build.sh${NC}"
    exit 1
fi

case $COMMAND in
    "status")
        echo -e "${YELLOW}[信息] 数据库状态检查...${NC}"
        echo ""
        echo -e "${BLUE}=== Docker容器状态 ===${NC}"
        docker-compose ps postgres
        echo ""
        echo -e "${BLUE}=== 数据库连接测试 ===${NC}"
        docker-compose exec postgres psql -U postgres -d cutrix -c "SELECT 'Database is accessible' as status;"
        echo ""
        echo -e "${BLUE}=== 数据库表列表 ===${NC}"
        docker-compose exec postgres psql -U postgres -d cutrix -c "\dt"
        echo ""
        echo -e "${BLUE}=== 数据统计 ===${NC}"
        docker-compose exec postgres psql -U postgres -d cutrix -c "SELECT 'styles' as table_name, COUNT(*) as count FROM styles UNION SELECT 'workers', COUNT(*) FROM workers UNION SELECT 'order_details', COUNT(*) FROM order_details UNION SELECT 'production_tasks', COUNT(*) FROM production_tasks UNION SELECT 'fabric_rolls', COUNT(*) FROM fabric_rolls UNION SELECT 'production_logs', COUNT(*) FROM production_logs;"
        ;;
    "connect")
        echo -e "${YELLOW}[信息] 连接到数据库...${NC}"
        echo -e "${YELLOW}[提示] 输入 \q 退出数据库连接${NC}"
        echo ""
        docker-compose exec postgres psql -U postgres -d cutrix
        ;;
    "backup")
        echo -e "${YELLOW}[信息] 备份数据库...${NC}"
        timestamp=$(date +"%Y%m%d_%H%M%S")
        mkdir -p backups
        backup_file="backups/cutrix_backup_${timestamp}.sql"
        echo -e "${YELLOW}[信息] 创建备份文件: ${backup_file}${NC}"
        
        docker-compose exec postgres pg_dump -U postgres cutrix > "$backup_file"
        if [ $? -eq 0 ]; then
            echo -e "${GREEN}[成功] 数据库备份完成: ${backup_file}${NC}"
        else
            echo -e "${RED}[错误] 备份失败${NC}"
        fi
        ;;
    "restore")
        echo -e "${YELLOW}[信息] 恢复数据库...${NC}"
        if [ ! -d "backups" ]; then
            echo -e "${RED}[错误] 没有找到backups文件夹${NC}"
            exit 1
        fi
        
        echo -e "${YELLOW}可用的备份文件:${NC}"
        ls -la backups/*.sql 2>/dev/null || {
            echo -e "${RED}[错误] 没有找到任何备份文件${NC}"
            exit 1
        }
        echo ""
        read -p "请输入要恢复的备份文件名（完整路径或相对路径）: " filename
        
        if [ ! -f "$filename" ]; then
            echo -e "${RED}[错误] 文件不存在: $filename${NC}"
            exit 1
        fi
        
        echo -e "${RED}[警告] 这将清空当前数据库并恢复为备份数据${NC}"
        read -p "确认继续？(y/N): " confirm
        if [[ $confirm != [yY] ]]; then
            echo "操作已取消"
            exit 0
        fi
        
        echo -e "${YELLOW}[信息] 恢复数据库从: $filename${NC}"
        docker-compose exec -T postgres psql -U postgres -d cutrix < "$filename"
        if [ $? -eq 0 ]; then
            echo -e "${GREEN}[成功] 数据库恢复完成${NC}"
        else
            echo -e "${RED}[错误] 恢复失败${NC}"
        fi
        ;;
    "reset")
        echo -e "${RED}[警告] 这将清空数据库所有数据！${NC}"
        read -p "确认重置数据库？(y/N): " confirm
        if [[ $confirm != [yY] ]]; then
            echo "操作已取消"
            exit 0
        fi
        
        echo -e "${YELLOW}[信息] 清空所有表数据...${NC}"
        docker-compose exec postgres psql -U postgres -d cutrix -c "TRUNCATE TABLE production_logs, fabric_rolls, production_tasks, order_details, workers, styles RESTART IDENTITY CASCADE;"
        echo -e "${GREEN}[成功] 数据库已重置${NC}"
        ;;
    "seed")
        echo -e "${YELLOW}[信息] 插入测试数据...${NC}"
        docker-compose exec postgres psql -U postgres -d cutrix -c "
INSERT INTO styles (style_number) VALUES ('BEE3TS111'), ('BEE3TS112'), ('BEE3TS113') ON CONFLICT (style_number) DO NOTHING;
INSERT INTO workers (name) VALUES ('张三'), ('李四'), ('王五'), ('赵六'), ('钱七') ON CONFLICT (name) DO NOTHING;
INSERT INTO order_details (style_id, color, quantity) VALUES (1, '韩白', 100), (1, '黑色', 80), (2, '韩白', 120), (3, '红色', 60) ON CONFLICT DO NOTHING;
INSERT INTO production_tasks (style_id, marker_id, color, planned_layers) VALUES (1, '321.1', '韩白', 38), (1, '321.2', '黑色', 40), (2, '322.1', '韩白', 45) ON CONFLICT DO NOTHING;
"
        echo -e "${GREEN}[成功] 测试数据插入完成${NC}"
        ;;
    "migrate")
        echo -e "${YELLOW}[信息] 手动运行数据库迁移...${NC}"
        docker-compose exec postgres psql -U postgres -d cutrix -c "\i /docker-entrypoint-initdb.d/000001_initial_schema.up.sql"
        if [ $? -eq 0 ]; then
            echo -e "${GREEN}[成功] 迁移脚本执行完成${NC}"
        else
            echo -e "${YELLOW}[警告] 迁移脚本可能已经执行过，或者执行失败${NC}"
        fi
        ;;
    *)
        echo -e "${RED}未知命令: $COMMAND${NC}"
        echo "运行 './db.sh help' 查看可用命令"
        exit 1
        ;;
esac