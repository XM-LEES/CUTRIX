package main

import (
	"context"
	"log"
	"net/http"
	"os"
	"os/signal"
	"strings"
	"syscall"
	"time"

	"cutrix-backend/internal/config"
	"cutrix-backend/internal/handlers"
	"cutrix-backend/internal/repositories"
	"cutrix-backend/internal/services"
	"cutrix-backend/pkg/database"
	"cutrix-backend/pkg/middleware"

	"github.com/gin-gonic/gin"
)

func main() {
	// 加载配置
	cfg, err := config.LoadConfig()
	if err != nil {
		log.Fatalf("Failed to load config: %v", err)
	}

	// 初始化数据库连接
	db, err := database.Initialize(cfg.DatabaseURL)
	if err != nil {
		log.Fatalf("Failed to initialize database: %v", err)
	}
	defer db.Close()

	// 设置Gin模式
	if cfg.Environment == "production" {
		gin.SetMode(gin.ReleaseMode)
	}

	// 创建Gin引擎
	r := gin.Default()

	// 添加中间件
	r.Use(middleware.CORS())
	r.Use(middleware.Logger())
	r.Use(middleware.Recovery())

	// ======== 统一初始化所有仓库 (Repositories) ========
	styleRepo := repositories.NewStyleRepository(db)
	orderRepo := repositories.NewOrderRepository(db)
	taskRepo := repositories.NewTaskRepository(db)
	fabricRepo := repositories.NewFabricRepository(db)
	logRepo := repositories.NewLogRepository(db)
	workerRepo := repositories.NewWorkerRepository(db)

	// ======== 统一初始化所有服务 (Services) ========
	styleService := services.NewStyleService(styleRepo)
	orderService := services.NewOrderService(orderRepo, styleRepo)
	taskService := services.NewTaskService(taskRepo, styleRepo)
	fabricService := services.NewFabricService(fabricRepo, styleRepo)
	logService := services.NewLogService(logRepo)
	workerQueryService := services.NewWorkerQueryService(workerRepo)
	workerManagementService := services.NewWorkerManagementService(workerRepo)

	// ======== 统一初始化所有处理器 (Handlers) ========
	styleHandler := handlers.NewStyleHandler(styleService)
	orderHandler := handlers.NewOrderHandler(orderService)
	taskHandler := handlers.NewTaskHandler(taskService)
	fabricHandler := handlers.NewFabricHandler(fabricService)
	logHandler := handlers.NewLogHandler(logService)
	workerHandler := handlers.NewWorkerHandler(workerQueryService, workerManagementService)

	// API路由组
	api := r.Group("/api")
	{
		// 款号管理
		styles := api.Group("/styles")
		{
			styles.POST("", styleHandler.CreateStyle)
			styles.GET("", styleHandler.GetStyles)
			styles.GET("/:id", styleHandler.GetStyle)
		}

		// 订单管理
		orders := api.Group("/orders")
		{
			orders.POST("", orderHandler.CreateOrder)
			orders.GET("", orderHandler.GetOrders)
			orders.GET("/:id", orderHandler.GetOrder)
		}

		// 生产任务管理
		tasks := api.Group("/tasks")
		{
			tasks.POST("", taskHandler.CreateTask)
			tasks.GET("", taskHandler.GetTasks)
			tasks.GET("/:id", taskHandler.GetTask)
			tasks.GET("/progress", taskHandler.GetTaskProgress)
		}

		// 布匹管理
		fabric := api.Group("/fabric-rolls")
		{
			fabric.POST("", fabricHandler.CreateFabricRoll)
			fabric.GET("", fabricHandler.GetFabricRolls)
			fabric.GET("/:id", fabricHandler.GetFabricRoll)
		}

		// 生产记录
		logs := api.Group("/production-logs")
		{
			logs.POST("", logHandler.CreateProductionLog)
			logs.GET("", logHandler.GetProductionLogs)
		}

		// 员工管理
		workers := api.Group("/workers")
		{
			workers.GET("", workerHandler.GetWorkers)
			workers.POST("", workerHandler.CreateWorker)
			workers.GET("/:id", workerHandler.GetWorker)
			workers.PUT("/:id", workerHandler.UpdateWorker)
			workers.DELETE("/:id", workerHandler.DeleteWorker)
			workers.GET("/:id/tasks", workerHandler.GetWorkerTasks)
		}
	}

	// 静态文件服务
	r.Static("/assets", "./web/dist/assets")
	r.StaticFile("/favicon.ico", "./web/dist/favicon.ico")

	// 健康检查
	r.GET("/health", func(c *gin.Context) {
		c.JSON(http.StatusOK, gin.H{"status": "ok"})
	})

	// SPA 路由处理 - 所有非 API 路径都返回 index.html
	r.NoRoute(func(c *gin.Context) {
		if strings.HasPrefix(c.Request.URL.Path, "/api") {
			c.JSON(http.StatusNotFound, gin.H{"error": "API not found"})
			return
		}
		// 尝试提供静态文件，如果不存在则返回 index.html
		c.File("./web/dist/index.html")
	})

	// 启动服务器
	srv := &http.Server{
		Addr:    ":" + cfg.Port,
		Handler: r,
	}

	// 优雅关闭
	go func() {
		if err := srv.ListenAndServe(); err != nil && err != http.ErrServerClosed {
			log.Fatalf("Failed to start server: %v", err)
		}
	}()

	log.Printf("Server started on port %s", cfg.Port)

	// 等待中断信号
	quit := make(chan os.Signal, 1)
	signal.Notify(quit, syscall.SIGINT, syscall.SIGTERM)
	<-quit
	log.Println("Shutting down server...")

	// 优雅关闭，等待5秒
	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()
	if err := srv.Shutdown(ctx); err != nil {
		log.Fatal("Server forced to shutdown:", err)
	}

	log.Println("Server exited")
}
