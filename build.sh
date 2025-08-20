#!/bin/bash
# CUTRIX Project Build Script (Linux/macOS)
# 使用方法:
#   ./build.sh          - 正常构建启动
#   ./build.sh clean    - 清理并重新构建（删除所有容器和卷）
#   ./build.sh dev      - 开发模式启动
#   ./build.sh reset    - 重置数据库（仅删除数据库卷）
#   ./build.sh logs     - 查看日志
#   ./build.sh stop     - 停止所有服务

set -e  # 遇到错误立即退出

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[0;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# 解析命令行参数
COMMAND=${1:-normal}

echo -e "${BLUE}========================================${NC}"
echo -e "${BLUE}     CUTRIX 裁剪车间管理系统构建脚本${NC}"
echo -e "${BLUE}========================================${NC}"

# 检查命令行参数
case $COMMAND in
    "clean")
        echo -e "${YELLOW}[信息] 执行完全清理构建...${NC}"
        echo -e "${RED}[警告] 这将删除所有Docker容器、卷和镜像，包括数据库数据！${NC}"
        read -p "确认继续？(y/N): " confirm
        if [[ $confirm != [yY] ]]; then
            echo "操作已取消"
            exit 0
        fi
        
        echo -e "${YELLOW}[信息] 停止并删除所有相关容器...${NC}"
        docker-compose down || true
        echo -e "${YELLOW}[信息] 删除所有卷（包括数据库数据）...${NC}"
        docker-compose down -v || true
        echo -e "${YELLOW}[信息] 清理未使用的Docker资源...${NC}"
        docker system prune -f || true
        ;;
    "dev")
        echo -e "${YELLOW}[信息] 开发模式启动...${NC}"
        echo -e "${YELLOW}[信息] 跳过前端构建，仅启动后端服务和数据库...${NC}"
        check_requirements
        start_services
        show_status
        exit 0
        ;;
    "reset")
        echo -e "${YELLOW}[信息] 重置数据库...${NC}"
        echo -e "${RED}[警告] 这将删除所有数据库数据！${NC}"
        read -p "确认重置数据库？(y/N): " confirm
        if [[ $confirm != [yY] ]]; then
            echo "操作已取消"
            exit 0
        fi
        
        echo -e "${YELLOW}[信息] 停止服务...${NC}"
        docker-compose stop postgres || true
        echo -e "${YELLOW}[信息] 删除数据库卷...${NC}"
        docker volume rm cutrix_postgres_data 2>/dev/null || true
        echo -e "${YELLOW}[信息] 重新启动服务...${NC}"
        docker-compose up -d postgres
        sleep 5
        docker-compose up -d backend
        echo -e "${GREEN}[信息] 数据库重置完成！新的数据库将自动运行迁移脚本。${NC}"
        show_status
        exit 0
        ;;
    "logs")
        echo -e "${YELLOW}[信息] 显示服务日志...${NC}"
        docker-compose logs -f
        exit 0
        ;;
    "stop")
        echo -e "${YELLOW}[信息] 停止所有服务...${NC}"
        docker-compose stop
        echo -e "${GREEN}[信息] 所有服务已停止${NC}"
        exit 0
        ;;
    "normal")
        echo -e "${YELLOW}[信息] 执行正常构建启动...${NC}"
        ;;
    *)
        echo -e "${RED}未知命令: $COMMAND${NC}"
        echo ""
        echo "可用命令:"
        echo "  ./build.sh          - 正常构建启动"
        echo "  ./build.sh clean    - 清理并重新构建（删除所有容器和卷）"
        echo "  ./build.sh dev      - 开发模式启动"
        echo "  ./build.sh reset    - 重置数据库（仅删除数据库卷）"
        echo "  ./build.sh logs     - 查看日志"
        echo "  ./build.sh stop     - 停止所有服务"
        exit 1
        ;;
esac

# 检查必要工具
check_requirements() {
    echo -e "${YELLOW}[检查] 验证开发环境...${NC}"
    
    if ! command -v node &> /dev/null; then
        echo -e "${RED}[错误] 未找到 Node.js，请先安装 Node.js${NC}"
        echo "下载地址: https://nodejs.org/"
        exit 1
    fi
    
    if ! command -v npm &> /dev/null; then
        echo -e "${RED}[错误] 未找到 npm，请先安装 npm${NC}"
        exit 1
    fi
    
    if ! command -v docker &> /dev/null; then
        echo -e "${RED}[错误] 未找到 Docker，请先安装 Docker${NC}"
        echo "下载地址: https://www.docker.com/products/docker-desktop"
        exit 1
    fi
    
    if ! command -v docker-compose &> /dev/null; then
        echo -e "${RED}[错误] 未找到 docker-compose，请先安装 docker-compose${NC}"
        exit 1
    fi
    
    echo -e "${GREEN}[信息] 开发环境检查通过 ✓${NC}"
}

# 构建前端
build_frontend() {
    if [[ $COMMAND == "dev" ]]; then
        return
    fi
    
    echo -e "${YELLOW}[构建] 安装前端依赖...${NC}"
    cd web-frontend
    
    if [ ! -d "node_modules" ]; then
        npm install
        if [ $? -ne 0 ]; then
            echo -e "${RED}[错误] npm install 失败${NC}"
            cd ..
            exit 1
        fi
    else
        echo -e "${YELLOW}[信息] node_modules 已存在，跳过安装（如需重新安装请删除 node_modules 文件夹）${NC}"
    fi
    
    echo -e "${YELLOW}[构建] 构建前端项目...${NC}"
    npm run build
    if [ $? -ne 0 ]; then
        echo -e "${RED}[错误] 前端构建失败${NC}"
        cd ..
        exit 1
    fi
    
    echo -e "${GREEN}[信息] 前端构建完成 ✓ 静态文件已输出到 backend/web/dist/${NC}"
    cd ..
}

# 启动服务
start_services() {
    echo -e "${YELLOW}[Docker] 启动Docker服务...${NC}"
    
    # 检查是否已有运行的容器
    if docker-compose ps | grep -q "Up"; then
        echo -e "${YELLOW}[信息] 检测到运行中的服务，正在重启...${NC}"
        docker-compose down
        sleep 2
    fi
    
    echo -e "${YELLOW}[Docker] 启动所有服务...${NC}"
    docker-compose up -d
    if [ $? -ne 0 ]; then
        echo -e "${RED}[错误] Docker服务启动失败${NC}"
        echo -e "${YELLOW}[提示] 请检查：${NC}"
        echo "  1. Docker 服务是否正在运行"
        echo "  2. 端口 8080, 5432, 6379 是否被其他程序占用"
        echo "  3. docker-compose.yml 配置是否正确"
        exit 1
    fi
    
    echo -e "${YELLOW}[等待] 等待服务启动...${NC}"
    sleep 10
}

# 显示状态
show_status() {
    echo ""
    echo -e "${BLUE}========================================${NC}"
    echo -e "${BLUE}         🎉 CUTRIX 系统启动成功！${NC}"
    echo -e "${BLUE}========================================${NC}"
    echo ""
    echo -e "${YELLOW}📊 服务状态:${NC}"
    docker-compose ps
    echo ""
    echo -e "${YELLOW}🌐 访问地址:${NC}"
    echo "  应用首页:     http://localhost:8080"
    echo "  API健康检查:  http://localhost:8080/health"
    echo "  员工管理:     http://localhost:8080 (侧边栏)"
    echo ""
    echo -e "${YELLOW}🔧 开发工具:${NC}"
    echo "  查看日志:     docker-compose logs -f"
    echo "  停止服务:     docker-compose stop"
    echo "  重启服务:     docker-compose restart"
    echo ""
    echo -e "${YELLOW}💡 快捷命令:${NC}"
    echo "  ./build.sh logs    - 查看实时日志"
    echo "  ./build.sh stop    - 停止所有服务"
    echo "  ./build.sh reset   - 重置数据库"
    echo "  ./build.sh clean   - 完全重新构建"
    echo ""
    
    # 健康检查
    echo -e "${YELLOW}[检查] 验证服务健康状态...${NC}"
    sleep 5
    
    if curl -s http://localhost:8080/health > /dev/null 2>&1; then
        echo -e "${GREEN}[成功] ✓ 后端API服务正常${NC}"
    else
        echo -e "${YELLOW}[警告] ⚠ 后端API可能还在启动中，请稍后再试${NC}"
        echo -e "${YELLOW}[信息] 如果持续失败，请运行: ./build.sh logs 查看日志${NC}"
    fi
    
    if curl -s http://localhost:8080/ > /dev/null 2>&1; then
        echo -e "${GREEN}[成功] ✓ 前端页面服务正常${NC}"
    else
        echo -e "${YELLOW}[警告] ⚠ 前端页面可能还在启动中，请稍后再试${NC}"
    fi
    
    echo ""
    echo -e "${GREEN}系统已就绪！${NC}"
}

# 主流程
check_requirements
build_frontend
start_services
show_status