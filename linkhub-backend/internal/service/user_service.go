package service

import (
	"context"

	"github.com/zaki/linkhub-backend/internal/dto"
	"github.com/zaki/linkhub-backend/internal/model"
	"github.com/zaki/linkhub-backend/internal/repository"
	"github.com/zaki/linkhub-backend/pkg/apperror"
	"golang.org/x/crypto/bcrypt"
)

type UserService struct {
	repo repository.UserRepository
}

func NewUserService(repo repository.UserRepository) *UserService {
	return &UserService{repo: repo}
}

func (s *UserService) List(ctx context.Context) ([]model.User, error) {
	users, err := s.repo.List(ctx)
	if err != nil {
		return nil, apperror.Internal("gagal mengambil daftar user")
	}
	return users, nil
}

func (s *UserService) Create(ctx context.Context, in dto.CreateUserInput) (*model.User, error) {
	hash, err := bcrypt.GenerateFromPassword([]byte(in.Password), bcrypt.DefaultCost)
	if err != nil {
		return nil, apperror.Internal("gagal hash password")
	}

	u := &model.User{
		Username:     in.Username,
		PasswordHash: string(hash),
		Role:         in.Role,
	}
	if err := s.repo.Create(ctx, u); err != nil {
		return nil, apperror.Conflict("username sudah dipakai")
	}
	return u, nil
}
