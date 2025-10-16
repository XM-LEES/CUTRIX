package handlers

import (
	"net/http"
	"strconv"

	"cutrix-backend/internal/models"
	"cutrix-backend/internal/services"

	"github.com/gin-gonic/gin"
)

type LogHandler struct {
	logService services.LogService
}

func NewLogHandler(logService services.LogService) *LogHandler {
	return &LogHandler{
		logService: logService,
	}
}

func (h *LogHandler) CreateProductionLog(c *gin.Context) {
	var req models.CreateLogRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, models.APIResponse{
			Success: false,
			Message: "无效的请求数据",
			Error:   err.Error(),
		})
		return
	}

	err := h.logService.CreateLog(&req)
	if err != nil {
		c.JSON(http.StatusInternalServerError, models.APIResponse{
			Success: false,
			Message: "创建生产记录失败",
			Error:   err.Error(),
		})
		return
	}

	c.JSON(http.StatusCreated, models.APIResponse{
		Success: true,
		Message: "生产记录创建成功",
	})
}

func (h *LogHandler) GetLogsByTaskID(c *gin.Context) {
	taskIDStr := c.Param("taskID")
	taskID, err := strconv.Atoi(taskIDStr)
	if err != nil {
		c.JSON(http.StatusBadRequest, models.APIResponse{
			Success: false,
			Message: "无效的任务ID",
			Error:   err.Error(),
		})
		return
	}

	logs, err := h.logService.GetLogsByTaskID(taskID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, models.APIResponse{
			Success: false,
			Message: "获取生产记录失败",
			Error:   err.Error(),
		})
		return
	}

	c.JSON(http.StatusOK, models.APIResponse{
		Success: true,
		Message: "获取生产记录成功",
		Data:    logs,
	})
}
