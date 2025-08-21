package handlers

import (
	"net/http"

	"cutrix-backend/internal/models"
	"cutrix-backend/internal/services"

	"github.com/gin-gonic/gin"
)

type LogHandler struct {
	logService *services.LogService
}

func NewLogHandler(logService *services.LogService) *LogHandler {
	return &LogHandler{
		logService: logService,
	}
}

func (h *LogHandler) CreateProductionLog(c *gin.Context) {
	var req models.CreateProductionLogRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, models.APIResponse{
			Success: false,
			Message: "Invalid request body",
			Error:   err.Error(),
		})
		return
	}

	log, err := h.logService.CreateProductionLog(&req)
	if err != nil {
		c.JSON(http.StatusInternalServerError, models.APIResponse{
			Success: false,
			Message: "Failed to create production log",
			Error:   err.Error(),
		})
		return
	}

	c.JSON(http.StatusCreated, models.APIResponse{
		Success: true,
		Message: "Production log created successfully",
		Data:    log,
	})
}

func (h *LogHandler) GetProductionLogs(c *gin.Context) {
	logs, err := h.logService.GetProductionLogs()
	if err != nil {
		c.JSON(http.StatusInternalServerError, models.APIResponse{
			Success: false,
			Message: "Failed to retrieve production logs",
			Error:   err.Error(),
		})
		return
	}

	c.JSON(http.StatusOK, models.APIResponse{
		Success: true,
		Message: "Production logs retrieved successfully",
		Data:    logs,
	})
}
