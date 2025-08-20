# 构建阶段
FROM golang:1.24-alpine AS builder

# 设置工作目录
WORKDIR /app

# 安装必要的包
RUN apk add --no-cache git

# 1. 仅复制依赖描述文件
COPY go.mod go.sum ./

# 2. 下载依赖。只要 go.mod/go.sum 不变，这一层就会被缓存
RUN go mod download

# 3. 安装 air。只要依赖没变，这一层也会被缓存
RUN go install github.com/air-verse/air@latest

# 4. 最后再复制所有源代码。只有这一层及之后的步骤会在代码改变时重新执行
COPY . .

# 暴露端口
EXPOSE 8080

# 启动命令
CMD ["air", "-c", ".air.toml"]