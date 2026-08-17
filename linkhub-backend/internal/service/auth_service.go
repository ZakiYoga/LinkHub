package service

import (
	"context"
	"time"

	"github.com/golang-jwt/jwt/v5"
	"github.com/zaki/linkhub-backend/internal/repository"
	"github.com/zaki/linkhub-backend/pkg/apperror"
	"golang.org/x/crypto/bcrypt"
)

type Claims struct {
	Sub  string `json:"sub"`
	Role string `json:"role"`
	jwt.RegisteredClaims
}

type AuthService struct {
	userRepo    repository.UserRepository
	jwtSecret   string
	expiryHours int
}

func NewAuthService(userRepo repository.UserRepository, jwtSecret string, expiryHours int) *AuthService {
	return &AuthService{userRepo: userRepo, jwtSecret: jwtSecret, expiryHours: expiryHours}
}

// Login checks the password with bcrypt (never compare plaintext) and
// issues a JWT carrying sub (user id) and role, per design doc section 7.
func (s *AuthService) Login(ctx context.Context, username, password string) (string, error) {
	user, err := s.userRepo.FindByUsername(ctx, username)
	if err != nil {
		return "", apperror.Unauthorized("username atau password salah")
	}

	if err := bcrypt.CompareHashAndPassword([]byte(user.PasswordHash), []byte(password)); err != nil {
		return "", apperror.Unauthorized("username atau password salah")
	}

	claims := Claims{
		Sub:  user.ID.String(),
		Role: string(user.Role),
		RegisteredClaims: jwt.RegisteredClaims{
			ExpiresAt: jwt.NewNumericDate(time.Now().Add(time.Duration(s.expiryHours) * time.Hour)),
			IssuedAt:  jwt.NewNumericDate(time.Now()),
		},
	}

	token := jwt.NewWithClaims(jwt.SigningMethodHS256, claims)
	signed, err := token.SignedString([]byte(s.jwtSecret))
	if err != nil {
		return "", apperror.Internal("gagal membuat token")
	}
	return signed, nil
}
