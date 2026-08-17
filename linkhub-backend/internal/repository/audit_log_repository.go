package repository

import (
	"context"

	"github.com/zaki/linkhub-backend/internal/model"
	"gorm.io/gorm"
)

type AuditLogRepository interface {
	Create(ctx context.Context, log *model.AuditLog) error
	ListRecent(ctx context.Context, limit int) ([]model.AuditLog, error)
}

type auditLogRepository struct {
	db *gorm.DB
}

func NewAuditLogRepository(db *gorm.DB) AuditLogRepository {
	return &auditLogRepository{db: db}
}

func (r *auditLogRepository) Create(ctx context.Context, log *model.AuditLog) error {
	return r.db.WithContext(ctx).Create(log).Error
}

func (r *auditLogRepository) ListRecent(ctx context.Context, limit int) ([]model.AuditLog, error) {
	var logs []model.AuditLog
	err := r.db.WithContext(ctx).Order("created_at DESC").Limit(limit).Find(&logs).Error
	return logs, err
}
