package repository

import (
	"context"
	"time"

	"github.com/google/uuid"
	"github.com/zaki/linkhub-backend/internal/model"
	"gorm.io/gorm"
	"gorm.io/gorm/clause"
)

type FolderCollaboratorRepository interface {
	Add(ctx context.Context, folderID, userID, addedBy uuid.UUID) error
	Remove(ctx context.Context, folderID, userID uuid.UUID) error
	List(ctx context.Context, folderID uuid.UUID) ([]model.FolderCollaborator, error)
	// IsCollaboratorOfAny checks whether userID is a collaborator on ANY
	// of the given folder IDs — used to check the whole ancestor chain
	// in one query (design doc section 4/5).
	IsCollaboratorOfAny(ctx context.Context, folderIDs []uuid.UUID, userID uuid.UUID) (bool, error)
}

type folderCollaboratorRepository struct {
	db *gorm.DB
}

func NewFolderCollaboratorRepository(db *gorm.DB) FolderCollaboratorRepository {
	return &folderCollaboratorRepository{db: db}
}

func (r *folderCollaboratorRepository) Add(ctx context.Context, folderID, userID, addedBy uuid.UUID) error {
	fc := &model.FolderCollaborator{
		FolderID: folderID,
		UserID:   userID,
		AddedBy:  addedBy,
		AddedAt:  time.Now(),
	}
	// Plain Save() would misfire here: since both primary key columns
	// are always non-zero (they're supplied, not auto-generated), GORM
	// would treat every call as an UPDATE — silently affecting 0 rows on
	// the first-ever add instead of inserting. Explicit ON CONFLICT
	// upsert makes both "add new" and "re-add existing" work correctly.
	return r.db.WithContext(ctx).Clauses(clause.OnConflict{
		Columns:   []clause.Column{{Name: "folder_id"}, {Name: "user_id"}},
		DoUpdates: clause.AssignmentColumns([]string{"added_by", "added_at"}),
	}).Create(fc).Error
}

func (r *folderCollaboratorRepository) Remove(ctx context.Context, folderID, userID uuid.UUID) error {
	return r.db.WithContext(ctx).
		Where("folder_id = ? AND user_id = ?", folderID, userID).
		Delete(&model.FolderCollaborator{}).Error
}

func (r *folderCollaboratorRepository) List(ctx context.Context, folderID uuid.UUID) ([]model.FolderCollaborator, error) {
	var rows []model.FolderCollaborator
	err := r.db.WithContext(ctx).Where("folder_id = ?", folderID).Find(&rows).Error
	return rows, err
}

func (r *folderCollaboratorRepository) IsCollaboratorOfAny(ctx context.Context, folderIDs []uuid.UUID, userID uuid.UUID) (bool, error) {
	if len(folderIDs) == 0 {
		return false, nil
	}
	var count int64
	err := r.db.WithContext(ctx).Model(&model.FolderCollaborator{}).
		Where("folder_id IN ? AND user_id = ?", folderIDs, userID).
		Count(&count).Error
	return count > 0, err
}
