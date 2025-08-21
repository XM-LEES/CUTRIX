package services

// ValidationError 自定义验证错误类型，供所有服务共享
type ValidationError struct {
	Message string
}

func (e *ValidationError) Error() string {
	return e.Message
}
