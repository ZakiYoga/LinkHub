package service

import (
	"context"

	"github.com/google/uuid"
	"github.com/zaki/linkhub-backend/internal/model"
	"github.com/zaki/linkhub-backend/internal/repository"
	"github.com/zaki/linkhub-backend/pkg/apperror"
)

type TagService struct {
	repo repository.TagRepository
}

func NewTagService(repo repository.TagRepository) *TagService {
	return &TagService{repo: repo}
}

func (s *TagService) List(ctx context.Context) ([]model.Tag, error) {
	tags, err := s.repo.FindAll(ctx)
	if err != nil {
		return nil, apperror.Internal("gagal mengambil daftar tag")
	}
	return tags, nil
}

func (s *TagService) Create(ctx context.Context, name string) (*model.Tag, error) {
	t := &model.Tag{Name: name}
	if err := s.repo.Create(ctx, t); err != nil {
		return nil, apperror.Conflict("tag dengan nama ini sudah ada")
	}
	return t, nil
}

func (s *TagService) Update(ctx context.Context, id uuid.UUID, name string) (*model.Tag, error) {
	t := &model.Tag{ID: id, Name: name}
	if err := s.repo.Update(ctx, t); err != nil {
		return nil, apperror.Internal("gagal update tag")
	}
	return t, nil
}

func (s *TagService) Delete(ctx context.Context, id uuid.UUID) error {
	if err := s.repo.Delete(ctx, id); err != nil {
		return apperror.Internal("gagal menghapus tag")
	}
	return nil
}
