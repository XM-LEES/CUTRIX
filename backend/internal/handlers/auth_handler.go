package handlers

import (
	"cutrix-backend/internal/models"
	"cutrix-backend/internal/services"
	"net/http"

	"github.com/gin-gonic/gin"
)

// AuthHandler 处理器
type AuthHandler struct {
	authService services.AuthService
}

// NewAuthHandler 创建新的认证处理器
func NewAuthHandler(authService services.AuthService) *AuthHandler {
	return &AuthHandler{
		authService: authService,
	}
}

// Login 处理登录请求
func (h *AuthHandler) Login(c *gin.Context) {
	var req models.LoginRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, models.APIResponse{
			Success: false,
			Message: "无效的请求",
			Error:   err.Error(),
		})
		return
	}

	worker, err := h.authService.Login(&req)
	if err != nil {
		c.JSON(http.StatusUnauthorized, models.APIResponse{
			Success: false,
			Message: "登录失败",
			Error:   err.Error(),
		})
		return
	}

	// 在实际项目中，这里应该生成并返回JWT token
	// 为了简化，我们直接返回用户信息
	c.JSON(http.StatusOK, models.APIResponse{
		Success: true,
		Message: "登录成功",
		Data:    worker,
	})
}
