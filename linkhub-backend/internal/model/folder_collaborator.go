package model

import (
	"time"

	"github.com/google/uuid"
)

type FolderCollaborator struct {
	FolderID uuid.UUID `gorm:"type:uuid;primaryKey" json:"folder_id"`
	UserID   uuid.UUID `gorm:"type:uuid;primaryKey" json:"user_id"`
	AddedBy  uuid.UUID `gorm:"type:uuid;not null" json:"added_by"`
	AddedAt  time.Time `json:"added_at"`
}
