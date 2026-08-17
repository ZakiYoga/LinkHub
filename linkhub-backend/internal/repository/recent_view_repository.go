package repository

import (
	"context"
	"time"

	"github.com/google/uuid"
	"github.com/zaki/linkhub-backend/internal/model"
	"gorm.io/gorm"
	"gorm.io/gorm/clause"
)

type RecentViewRepository interface {
	// Track upserts: if this user already viewed this exact entity
	// before, just bump ViewedAt/EntityName instead of creating a
	// duplicate row (same OnConflict pattern as FolderCollaborator.Add
	// — composite unique key, not an auto-generated primary key, so
	// plain Save() would misfire here too).
	Track(ctx context.Context, userID uuid.UUID, entityType string, entityID uuid.UUID, entityName string) error
	ListByUser(ctx context.Context, userID uuid.UUID, limit int) ([]model.RecentView, error)
}

type recentViewRepository struct {
	db *gorm.DB
}

func NewRecentViewRepository(db *gorm.DB) RecentViewRepository {
	return &recentViewRepository{db: db}
}

func (r *recentViewRepository) Track(ctx context.Context, userID uuid.UUID, entityType string, entityID uuid.UUID, entityName string) error {
	rv := &model.RecentView{
		UserID:     userID,
		EntityType: entityType,
		EntityID:   entityID,
		EntityName: entityName,
		ViewedAt:   time.Now(),
	}
	return r.db.WithContext(ctx).Clauses(clause.OnConflict{
		Columns:   []clause.Column{{Name: "user_id"}, {Name: "entity_type"}, {Name: "entity_id"}},
		DoUpdates: clause.AssignmentColumns([]string{"entity_name", "viewed_at"}),
	}).Create(rv).Error
}

func (r *recentViewRepository) ListByUser(ctx context.Context, userID uuid.UUID, limit int) ([]model.RecentView, error) {
	var rows []model.RecentView
	err := r.db.WithContext(ctx).
		Where("user_id = ?", userID).
		Order("viewed_at DESC").
		Limit(limit).
		Find(&rows).Error
	return rows, err
}
