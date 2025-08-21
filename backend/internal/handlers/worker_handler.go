package handlers

import (
	"cutrix-backend/internal/models"
	"cutrix-backend/internal/services"
	"fmt"
	"net/http"
	"strconv"

	"github.com/gin-gonic/gin"
)

type WorkerHandler struct {
	workerService services.WorkerService
}

func NewWorkerHandler(workerService services.WorkerService) *WorkerHandler {
	return &WorkerHandler{
		workerService: workerService,
	}
}

// roleMap 用于错误消息的中文转换
var roleMap = map[string]string{
	"admin":   "管理员",
	"manager": "车间主任",
}

// GetWorkers ... (此函数及 GetWorker 函数保持不变)
func (h *WorkerHandler) GetWorkers(c *gin.Context) {
	workers, err := h.workerService.GetAll()
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
	worker, err := h.workerService.GetByID(id)
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

func (h *WorkerHandler) CreateWorker(c *gin.Context) {
	var req models.CreateWorkerRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, models.APIResponse{Success: false, Message: "请求参数无效", Error: err.Error()})
		return
	}

	if req.Role == "admin" || req.Role == "manager" {
		allWorkers, err := h.workerService.GetAll()
		if err != nil {
			c.JSON(http.StatusInternalServerError, models.APIResponse{Success: false, Message: "无法验证角色唯一性", Error: err.Error()})
			return
		}
		for _, w := range allWorkers {
			if w.Role == req.Role {
				// --- 修改点：使用 roleMap 进行中文提示 ---
				roleName := roleMap[req.Role]
				if roleName == "" {
					roleName = req.Role
				}
				c.JSON(http.StatusBadRequest, models.APIResponse{Success: false, Message: "创建失败", Error: fmt.Sprintf("角色 '%s' 已存在，且只能有一个", roleName)})
				return
			}
		}
	}

	worker, err := h.workerService.Create(&req)
	if err != nil {
		if validationErr, ok := err.(*services.ValidationError); ok {
			c.JSON(http.StatusBadRequest, models.APIResponse{Success: false, Message: "创建员工失败", Error: validationErr.Message})
			return
		}
		c.JSON(http.StatusInternalServerError, models.APIResponse{Success: false, Message: "创建员工失败", Error: err.Error()})
		return
	}

	c.JSON(http.StatusCreated, models.APIResponse{Success: true, Message: "创建员工成功", Data: worker})
}

func (h *WorkerHandler) UpdateWorker(c *gin.Context) {
	id, err := strconv.Atoi(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, models.APIResponse{Success: false, Message: "无效的员工ID", Error: "ID必须是数字"})
		return
	}

	var req models.UpdateWorkerRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, models.APIResponse{Success: false, Message: "请求参数无效", Error: err.Error()})
		return
	}

	if req.Role == "admin" || req.Role == "manager" {
		allWorkers, err := h.workerService.GetAll()
		if err != nil {
			c.JSON(http.StatusInternalServerError, models.APIResponse{Success: false, Message: "无法验证角色唯一性", Error: err.Error()})
			return
		}
		for _, w := range allWorkers {
			if w.Role == req.Role && w.WorkerID != id {
				// --- 修改点：使用 roleMap 进行中文提示 ---
				roleName := roleMap[req.Role]
				if roleName == "" {
					roleName = req.Role
				}
				c.JSON(http.StatusBadRequest, models.APIResponse{Success: false, Message: "更新失败", Error: fmt.Sprintf("角色 '%s' 已存在，且只能有一个", roleName)})
				return
			}
		}
	}

	worker, err := h.workerService.Update(id, &req)
	if err != nil {
		if validationErr, ok := err.(*services.ValidationError); ok {
			c.JSON(http.StatusBadRequest, models.APIResponse{Success: false, Message: "更新员工失败", Error: validationErr.Message})
			return
		}
		if err.Error() == "worker not found" {
			c.JSON(http.StatusNotFound, models.APIResponse{Success: false, Message: "员工不存在", Error: "找不到指定的员工"})
			return
		}
		c.JSON(http.StatusInternalServerError, models.APIResponse{Success: false, Message: "更新员工失败", Error: err.Error()})
		return
	}

	c.JSON(http.StatusOK, models.APIResponse{Success: true, Message: "更新员工成功", Data: worker})
}

// ... (DeleteWorker 及后续函数保持不变)
func (h *WorkerHandler) DeleteWorker(c *gin.Context) {
	id, err := strconv.Atoi(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, models.APIResponse{Success: false, Message: "无效的员工ID", Error: "ID必须是数字"})
		return
	}

	err = h.workerService.Delete(id)
	if err != nil {
		if validationErr, ok := err.(*services.ValidationError); ok {
			c.JSON(http.StatusBadRequest, models.APIResponse{Success: false, Message: "删除员工失败", Error: validationErr.Message})
			return
		}
		if err.Error() == "worker not found" {
			c.JSON(http.StatusNotFound, models.APIResponse{Success: false, Message: "员工不存在", Error: "找不到指定的员工"})
			return
		}
		c.JSON(http.StatusInternalServerError, models.APIResponse{Success: false, Message: "删除员工失败", Error: err.Error()})
		return
	}

	c.JSON(http.StatusOK, models.APIResponse{Success: true, Message: "删除员工成功"})
}

func (h *WorkerHandler) GetWorkerTasks(c *gin.Context) {
	id, err := strconv.Atoi(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, models.APIResponse{Success: false, Message: "无效的员工ID", Error: "ID必须是数字"})
		return
	}
	tasks, err := h.workerService.GetWorkerTasks(id)
	if err != nil {
		c.JSON(http.StatusInternalServerError, models.APIResponse{Success: false, Message: "获取员工任务列表失败", Error: err.Error()})
		return
	}
	c.JSON(http.StatusOK, models.APIResponse{Success: true, Message: "获取员工任务列表成功", Data: tasks})
}

func (h *WorkerHandler) UpdateWorkerPassword(c *gin.Context) {
	targetWorkerID, err := strconv.Atoi(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, models.APIResponse{Success: false, Message: "无效的员工ID"})
		return
	}
	var req models.UpdateWorkerPasswordRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, models.APIResponse{Success: false, Message: "请求参数无效", Error: err.Error()})
		return
	}
	updatingUserID := 1
	updatingUserRole := "admin"
	err = h.workerService.UpdatePassword(updatingUserID, updatingUserRole, targetWorkerID, req.Password)
	if err != nil {
		if validationErr, ok := err.(*services.ValidationError); ok {
			c.JSON(http.StatusForbidden, models.APIResponse{Success: false, Message: "操作失败", Error: validationErr.Message})
			return
		}
		c.JSON(http.StatusInternalServerError, models.APIResponse{Success: false, Message: "更新密码失败", Error: err.Error()})
		return
	}
	c.JSON(http.StatusOK, models.APIResponse{Success: true, Message: "密码更新成功"})
}
