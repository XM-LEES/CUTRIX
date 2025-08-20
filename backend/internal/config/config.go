package config

import (
	"fmt"
	"os"

	"github.com/spf13/viper"
)

type Config struct {
	Port         string `mapstructure:"PORT"`
	Environment  string `mapstructure:"ENVIRONMENT"`
	DatabaseURL  string `mapstructure:"DATABASE_URL"`
	JWTSecret    string `mapstructure:"JWT_SECRET"`
	LogLevel     string `mapstructure:"LOG_LEVEL"`
}

func LoadConfig() (*Config, error) {
	viper.AutomaticEnv()

	// 尝试读取.env文件（如果存在）
	viper.SetConfigFile(".env")
	if err := viper.ReadInConfig(); err != nil {
		// 如果文件不存在，继续使用环境变量
		if _, ok := err.(viper.ConfigFileNotFoundError); !ok {
			return nil, fmt.Errorf("error reading config file: %w", err)
		}
	}

	// 设置默认值
	viper.SetDefault("PORT", "8080")
	viper.SetDefault("ENVIRONMENT", "development")
	viper.SetDefault("DATABASE_URL", "postgres://postgres:password@localhost:5432/cutrix?sslmode=disable")
	viper.SetDefault("JWT_SECRET", "your-secret-key")
	viper.SetDefault("LOG_LEVEL", "info")

	var config Config
	if err := viper.Unmarshal(&config); err != nil {
		return nil, fmt.Errorf("unable to decode config: %w", err)
	}

	return &config, nil
}

func GetEnv(key, defaultValue string) string {
	if value, exists := os.LookupEnv(key); exists {
		return value
	}
	return defaultValue
}