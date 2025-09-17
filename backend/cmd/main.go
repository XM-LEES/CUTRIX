package main

import (
	"context"
	"cutrix-backend/internal/config"
	"cutrix-backend/internal/handlers"
	"cutrix-backend/internal/repositories"
	"cutrix-backend/internal/services"
	"cutrix-backend/pkg/database"
	"cutrix-backend/pkg/middleware"
	"log"
	"net/http"
	"os"
	"os/signal"
	"strings"
	"syscall"
	"time"

	"github.com/gin-gonic/gin"
)

func main() {
	// ... (加载配置和初始化数据库部分不变)
	cfg, err := config.LoadConfig()
	if err != nil {
		log.Fatalf("Failed to load config: %v", err)
	}

	db, err := database.Initialize(cfg.DatabaseURL)
	if err != nil {
		log.Fatalf("Failed to initialize database: %v", err)
	}
	defer db.Close()

	// ... (设置 Gin 模式和中间件部分不变)
	if cfg.Environment == "production" {
		gin.SetMode(gin.ReleaseMode)
	}
	r := gin.Default()
	r.Use(middleware.CORS())
	r.Use(middleware.Logger())
	r.Use(middleware.Recovery())

	// ======== 统一初始化所有仓库 (Repositories) ========
	styleRepo := repositories.NewStyleRepository(db)
	taskRepo := repositories.NewTaskRepository(db)
	fabricRepo := repositories.NewFabricRepository(db)
	logRepo := repositories.NewLogRepository(db)
	workerRepo := repositories.NewWorkerRepository(db)
	orderRepo := repositories.NewProductionOrderRepository(db)
	planRepo := repositories.NewProductionPlanRepository(db)

	// ======== 统一初始化所有服务 (Services) ========
	authService := services.NewAuthService(workerRepo)
	styleService := services.NewStyleService(styleRepo)
	taskService := services.NewTaskService(taskRepo, styleRepo)
	fabricService := services.NewFabricService(fabricRepo, styleRepo)
	logService := services.NewLogService(logRepo)
	orderService := services.NewProductionOrderService(db, orderRepo, styleRepo)
	planService := services.NewProductionPlanService(db, planRepo)
	workerService := services.NewWorkerService(workerRepo)

	// ======== 统一初始化所有处理器 (Handlers) ========
	authHandler := handlers.NewAuthHandler(authService)
	styleHandler := handlers.NewStyleHandler(styleService)
	taskHandler := handlers.NewTaskHandler(taskService)
	fabricHandler := handlers.NewFabricHandler(fabricService)
	logHandler := handlers.NewLogHandler(logService)
	orderHandler := handlers.NewProductionOrderHandler(orderService)
	planHandler := handlers.NewProductionPlanHandler(planService)
	workerHandler := handlers.NewWorkerHandler(workerService)

	// ... (API 路由组部分不变)
	api := r.Group("/api")
	{
		// 认证
		auth := api.Group("/auth")
		{
			auth.POST("/login", authHandler.Login)
		}

		// 款号管理
		styles := api.Group("/styles")
		{
			styles.POST("", styleHandler.CreateStyle)
			styles.GET("", styleHandler.GetStyles)
			styles.GET("/:id", styleHandler.GetStyle)
		}

		// 生产订单管理 (新)
		orders := api.Group("/production-orders")
		{
			orders.POST("", orderHandler.CreateOrder)
			orders.GET("", orderHandler.GetOrders)
			orders.GET("/unplanned", orderHandler.GetUnplannedOrders)
			orders.GET("/:id", orderHandler.GetOrder)
			orders.DELETE("/:id", orderHandler.DeleteOrder)
		}

		// 生产计划管理 (新)
		plans := api.Group("/production-plans")
		{
			plans.POST("", planHandler.CreatePlan)
			plans.GET("", planHandler.GetPlans)
			plans.GET("/:id", planHandler.GetPlan)
			plans.PUT("/:id", planHandler.UpdatePlan)
			plans.DELETE("/:id", planHandler.DeletePlan)
			plans.GET("/by-order/:order_id", planHandler.GetPlanByOrderID)
		}
		// 生产任务管理
		tasks := api.Group("/tasks")
		{
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
			workers.PUT("/:id/password", workerHandler.UpdateWorkerPassword)
		}
	}

	// ... (静态文件服务和服务器启动部分不变)
	r.Static("/assets", "./web/dist/assets")
	r.StaticFile("/favicon.ico", "./web/dist/favicon.ico")
	r.GET("/health", func(c *gin.Context) {
		c.JSON(http.StatusOK, gin.H{"status": "ok"})
	})
	r.NoRoute(func(c *gin.Context) {
		if strings.HasPrefix(c.Request.URL.Path, "/api") {
			c.JSON(http.StatusNotFound, gin.H{"error": "API not found"})
			return
		}
		c.File("./web/dist/index.html")
	})

	srv := &http.Server{
		Addr:    ":" + cfg.Port,
		Handler: r,
	}

	go func() {
		if err := srv.ListenAndServe(); err != nil && err != http.ErrServerClosed {
			log.Fatalf("Failed to start server: %v", err)
		}
	}()

	log.Printf("Server started on port %s", cfg.Port)

	quit := make(chan os.Signal, 1)
	signal.Notify(quit, syscall.SIGINT, syscall.SIGTERM)
	<-quit
	log.Println("Shutting down server...")

	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()
	if err := srv.Shutdown(ctx); err != nil {
		log.Fatal("Server forced to shutdown:", err)
	}

	log.Println("Server exited")
}
