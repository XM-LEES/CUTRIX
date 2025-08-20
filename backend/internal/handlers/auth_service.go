package services

import (
	"errors"
	"time"
	"cutrix-backend/internal/models"
	"cutrix-backend/internal/repositories"
	"github.com/golang-jwt/jwt/v5"
	"golang.org/x/crypto/bcrypt"
)

// JWT secret key - 应该从配置中读取
var jwtKey = []byte("your-secret-key")

type AuthService interface {
	Login(username, password string) (string, error)
}

type authService struct {
	workerRepo repositories.WorkerRepository
}

func NewAuthService(workerRepo repositories.WorkerRepository) AuthService {
	return &authService{workerRepo: workerRepo}
}

func (s *authService) Login(username, password string) (string, error) {
	worker, err := s.workerRepo.GetByUsername(username)
	if err != nil {
		return "", errors.New("invalid credentials")
	}

	if !worker.IsActive {
		return "", errors.New("user account is inactive")
	}

	// 管理员登录逻辑
	if worker.Role == "admin" {
		if password == "" {
			return "", errors.New("password is required for admin")
		}
		err := bcrypt.CompareHashAndPassword([]byte(worker.PasswordHash), []byte(password))
		if err != nil {
			return "", errors.New("invalid credentials")
		}
	}
    // 员工登录逻辑 (无需密码验证)

	// 创建 JWT token
	expirationTime := time.Now().Add(24 * time.Hour)
	claims := &jwt.RegisteredClaims{
		ExpiresAt: jwt.NewNumericDate(expirationTime),
		Subject:   string(rune(worker.WorkerID)),
        Issuer:    "cutrix-backend",
	}

	token := jwt.NewWithClaims(jwt.SigningMethodHS256, claims)
	tokenString, err := token.SignedString(jwtKey)
	if err != nil {
		return "", err
	}

	return tokenString, nil
}

在 worker_repository.go 中添加 GetByUsername 方法:
文件: backend/internal/repositories/worker_repository.go

// 在 WorkerRepository 接口中添加
GetByUsername(username string) (*models.Worker, error)

// 在 workerRepository 中实现
func (r *workerRepository) GetByUsername(username string) (*models.Worker, error) {
	var worker models.Worker
	query := `SELECT worker_id, name, COALESCE(notes, '') as notes, username, password_hash, role, is_active FROM Workers WHERE username = $1`
	err := r.db.Get(&worker, query, username)
	if err != nil {
		if err == sql.ErrNoRows {
			return nil, fmt.Errorf("worker not found")
		}
		return nil, fmt.Errorf("failed to get worker by username: %w", err)
	}
	return &worker, nil
}
