package handlers

import (
	"fmt"
	"net/http"
	"strconv"

	"cutrix-backend/internal/models"
	"cutrix-backend/internal/services"

	"github.com/gin-gonic/gin"
)

type WorkerHandler struct {
	workerQueryService      services.WorkerQueryService
	workerManagementService services.WorkerManagementService
}

func NewWorkerHandler(workerQueryService services.WorkerQueryService, workerManagementService services.WorkerManagementService) *WorkerHandler {
	return &WorkerHandler{
		workerQueryService:      workerQueryService,
		workerManagementService: workerManagementService,
	}
}

// GetWorkers 获取所有员工
func (h *WorkerHandler) GetWorkers(c *gin.Context) {
	workers, err := h.workerQueryService.GetAll()
	if err != nil {
		c.JSON(http.StatusInternalServerError, models.APIResponse{
			Success: false,
			Message: "获取员工列表失败",
			Error:   err.Error(),
		})
		return
	}

	c.JSON(http.StatusOK, models.APIResponse{
		Success: true,
		Message: "获取员工列表成功",
		Data:    workers,
	})
}

// GetWorker 获取单个员工
func (h *WorkerHandler) GetWorker(c *gin.Context) {
	id, err := strconv.Atoi(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, models.APIResponse{
			Success: false,
			Message: "无效的员工ID",
			Error:   "ID必须是数字",
		})
		return
	}

	worker, err := h.workerQueryService.GetByID(id)
	if err != nil {
		c.JSON(http.StatusNotFound, models.APIResponse{
			Success: false,
			Message: "员工不存在",
			Error:   err.Error(),
		})
		return
	}

	c.JSON(http.StatusOK, models.APIResponse{
		Success: true,
		Message: "获取员工成功",
		Data:    worker,
	})
}

// CreateWorker 创建员工
func (h *WorkerHandler) CreateWorker(c *gin.Context) {
	var req models.CreateWorkerRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, models.APIResponse{
			Success: false,
			Message: "请求参数无效",
			Error:   err.Error(),
		})
		return
	}

	// 权限和业务规则检查
	// 规则：确保系统中只有一个 admin 和一个 manager
	if req.Role == "admin" || req.Role == "manager" {
		allWorkers, err := h.workerQueryService.GetAll()
		if err != nil {
			c.JSON(http.StatusInternalServerError, models.APIResponse{Success: false, Message: "无法验证角色唯一性", Error: err.Error()})
			return
		}
		for _, w := range allWorkers {
			if w.Role == req.Role {
				c.JSON(http.StatusBadRequest, models.APIResponse{Success: false, Message: "创建失败", Error: fmt.Sprintf("角色 '%s' 已存在，且只能有一个", req.Role)})
				return
			}
		}
	}

	worker, err := h.workerManagementService.Create(&req)
	if err != nil {
		// Check if it's a validation error
		if validationErr, ok := err.(*services.ValidationError); ok {
			c.JSON(http.StatusBadRequest, models.APIResponse{
				Success: false,
				Message: "创建员工失败",
				Error:   validationErr.Message,
			})
			return
		}

		c.JSON(http.StatusInternalServerError, models.APIResponse{
			Success: false,
			Message: "创建员工失败",
			Error:   err.Error(),
		})
		return
	}

	c.JSON(http.StatusCreated, models.APIResponse{
		Success: true,
		Message: "创建员工成功",
		Data:    worker,
	})
}

// UpdateWorker 更新员工
func (h *WorkerHandler) UpdateWorker(c *gin.Context) {
	id, err := strconv.Atoi(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, models.APIResponse{
			Success: false,
			Message: "无效的员工ID",
			Error:   "ID必须是数字",
		})
		return
	}

	var req models.UpdateWorkerRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, models.APIResponse{
			Success: false,
			Message: "请求参数无效",
			Error:   err.Error(),
		})
		return
	}

	// 规则：确保系统中只有一个 admin 和一个 manager
	if req.Role == "admin" || req.Role == "manager" {
		allWorkers, err := h.workerQueryService.GetAll()
		if err != nil {
			c.JSON(http.StatusInternalServerError, models.APIResponse{Success: false, Message: "无法验证角色唯一性", Error: err.Error()})
			return
		}
		for _, w := range allWorkers {
			if w.Role == req.Role && w.WorkerID != id { // 确保不是员工自己
				c.JSON(http.StatusBadRequest, models.APIResponse{Success: false, Message: "更新失败", Error: fmt.Sprintf("角色 '%s' 已存在，且只能有一个", req.Role)})
				return
			}
		}
	}

	worker, err := h.workerManagementService.Update(id, &req)
	if err != nil {
		// Check if it's a validation error
		if validationErr, ok := err.(*services.ValidationError); ok {
			c.JSON(http.StatusBadRequest, models.APIResponse{
				Success: false,
				Message: "更新员工失败",
				Error:   validationErr.Message,
			})
			return
		}

		// Check if worker not found
		if err.Error() == "worker not found" {
			c.JSON(http.StatusNotFound, models.APIResponse{
				Success: false,
				Message: "员工不存在",
				Error:   "找不到指定的员工",
			})
			return
		}

		c.JSON(http.StatusInternalServerError, models.APIResponse{
			Success: false,
			Message: "更新员工失败",
			Error:   err.Error(),
		})
		return
	}

	c.JSON(http.StatusOK, models.APIResponse{
		Success: true,
		Message: "更新员工成功",
		Data:    worker,
	})
}

// DeleteWorker 删除员工
func (h *WorkerHandler) DeleteWorker(c *gin.Context) {
	id, err := strconv.Atoi(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, models.APIResponse{
			Success: false,
			Message: "无效的员工ID",
			Error:   "ID必须是数字",
		})
		return
	}

	err = h.workerManagementService.Delete(id)
	if err != nil {
		// Check if worker not found
		if err.Error() == "worker not found" {
			c.JSON(http.StatusNotFound, models.APIResponse{
				Success: false,
				Message: "员工不存在",
				Error:   "找不到指定的员工",
			})
			return
		}

		c.JSON(http.StatusInternalServerError, models.APIResponse{
			Success: false,
			Message: "删除员工失败",
			Error:   err.Error(),
		})
		return
	}

	c.JSON(http.StatusOK, models.APIResponse{
		Success: true,
		Message: "删除员工成功",
	})
}

// GetWorkerTasks 获取员工的任务列表
func (h *WorkerHandler) GetWorkerTasks(c *gin.Context) {
	id, err := strconv.Atoi(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, models.APIResponse{
			Success: false,
			Message: "无效的员工ID",
			Error:   "ID必须是数字",
		})
		return
	}

	tasks, err := h.workerQueryService.GetWorkerTasks(id)
	if err != nil {
		c.JSON(http.StatusInternalServerError, models.APIResponse{
			Success: false,
			Message: "获取员工任务列表失败",
			Error:   err.Error(),
		})
		return
	}

	c.JSON(http.StatusOK, models.APIResponse{
		Success: true,
		Message: "获取员工任务列表成功",
		Data:    tasks,
	})
}
