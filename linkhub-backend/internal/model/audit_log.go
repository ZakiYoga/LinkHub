package model

import (
	"time"

	"github.com/google/uuid"
)

type AuditLog struct {
	ID         uuid.UUID `gorm:"type:uuid;primaryKey;default:gen_random_uuid()" json:"id"`
	EntityType string    `gorm:"not null" json:"entity_type"` // "folder" | "menu_item"
	EntityID   uuid.UUID `gorm:"type:uuid;not null;index" json:"entity_id"`
	EntityName string    `json:"entity_name"`
	Action     string    `gorm:"not null" json:"action"` // created | updated | deleted | collaborator_added | collaborator_removed
	ActorID    uuid.UUID `gorm:"type:uuid;not null" json:"actor_id"`
	CreatedAt  time.Time `json:"created_at"`
}
