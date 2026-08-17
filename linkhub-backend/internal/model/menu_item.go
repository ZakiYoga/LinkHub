package model

import (
	"time"

	"github.com/google/uuid"
)

type ItemType string

const (
	ItemTypeSpreadsheet ItemType = "spreadsheet"
	ItemTypeSlides      ItemType = "slides"
	ItemTypeDrive       ItemType = "drive"
	ItemTypeDocument    ItemType = "document"
	ItemTypeForm        ItemType = "form"
	ItemTypeOther       ItemType = "other"
)

type MenuItem struct {
	ID          uuid.UUID  `gorm:"type:uuid;primaryKey;default:gen_random_uuid()" json:"id"`
	Name        string     `gorm:"not null" json:"name"`
	URL         string     `gorm:"not null;uniqueIndex" json:"url"`
	Type        ItemType   `gorm:"not null" json:"type"`
	FolderID    *uuid.UUID `gorm:"type:uuid;index" json:"folder_id"`
	Description string     `json:"description"`
	Tags        []Tag      `gorm:"many2many:menu_item_tags;" json:"tags"`
	CreatedBy   uuid.UUID  `gorm:"type:uuid" json:"created_by"`
	UpdatedBy   *uuid.UUID `gorm:"type:uuid" json:"updated_by"`
	CreatedAt   time.Time  `json:"created_at"`
	UpdatedAt   time.Time  `json:"updated_at"`

	DeletedAt *time.Time `json:"deleted_at,omitempty"`
	DeletedBy *uuid.UUID `gorm:"type:uuid" json:"deleted_by,omitempty"`
}
