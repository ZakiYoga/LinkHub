// Note: tag_repository.go isn't explicitly listed in the design doc's
// backend tree (section 5), but tag_handler.go is — CRUD tag needs a
// repository underneath it, so this file fills that gap using the same
// interface pattern as folder/item repositories.
package repository

import (
	"context"

	"github.com/google/uuid"
	"github.com/zaki/linkhub-backend/internal/model"
	"gorm.io/gorm"
)

type TagRepository interface {
	FindAll(ctx context.Context) ([]model.Tag, error)
	Create(ctx context.Context, t *model.Tag) error
	Update(ctx context.Context, t *model.Tag) error
	Delete(ctx context.Context, id uuid.UUID) error
}

type tagRepository struct {
	db *gorm.DB
}

func NewTagRepository(db *gorm.DB) TagRepository {
	return &tagRepository{db: db}
}

func (r *tagRepository) FindAll(ctx context.Context) ([]model.Tag, error) {
	var tags []model.Tag
	err := r.db.WithContext(ctx).Order("name ASC").Find(&tags).Error
	return tags, err
}

func (r *tagRepository) Create(ctx context.Context, t *model.Tag) error {
	return r.db.WithContext(ctx).Create(t).Error
}

func (r *tagRepository) Update(ctx context.Context, t *model.Tag) error {
	return r.db.WithContext(ctx).Save(t).Error
}

func (r *tagRepository) Delete(ctx context.Context, id uuid.UUID) error {
	// menu_item_tags rows are cleaned up via ON DELETE CASCADE FK.
	return r.db.WithContext(ctx).Delete(&model.Tag{}, "id = ?", id).Error
}
