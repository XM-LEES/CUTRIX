# 构建阶段
FROM golang:1.24-alpine AS builder

# 设置工作目录
WORKDIR /app

# 安装必要的包
RUN apk add --no-cache git

# 复制go mod文件
COPY go.mod go.sum ./

# 下载依赖
RUN go mod download

# 复制源代码
COPY . .

# 安装air用于热重载
RUN go install github.com/air-verse/air@latest

# 暴露端口
EXPOSE 8080

# 启动命令
CMD ["air", "-c", ".air.toml"]