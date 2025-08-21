package services

import (
	"cutrix-backend/internal/models"
	"cutrix-backend/internal/repositories"
	"fmt"

	"golang.org/x/crypto/bcrypt"
)

// AuthService 定义认证服务接口
type AuthService interface {
	Login(req *models.LoginRequest) (*models.Worker, error)
}

type authService struct {
	workerRepo repositories.WorkerRepository
}

// NewAuthService 创建新的认证服务实例
func NewAuthService(workerRepo repositories.WorkerRepository) AuthService {
	return &authService{workerRepo: workerRepo}
}

// Login 处理用户登录请求
func (s *authService) Login(req *models.LoginRequest) (*models.Worker, error) {
	// 1. 根据用户名查找用户
	worker, err := s.workerRepo.GetByName(req.Name)
	if err != nil {
		return nil, fmt.Errorf("无效的用户名或密码")
	}

	// 2. 检查用户是否激活
	if !worker.IsActive {
		return nil, fmt.Errorf("用户已被禁用")
	}

	// 3. 强制验证密码
	if req.Password == "" {
		return nil, fmt.Errorf("请输入密码")
	}
	err = bcrypt.CompareHashAndPassword([]byte(worker.PasswordHash), []byte(req.Password))
	if err != nil {
		return nil, fmt.Errorf("无效的用户名或密码")
	}

	// 4. 登录成功，返回用户信息（确保清空密码哈希）
	worker.PasswordHash = ""
	return worker, nil
}
