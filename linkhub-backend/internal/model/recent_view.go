package model

import (
	"time"

	"github.com/google/uuid"
)

// RecentView tracks what a logged-in user has recently opened
// (folders and items), for a "Recent" panel — not part of the original
// design doc text. Deliberately user_id-only, no anonymous/guest rows:
// guest history lives entirely client-side (localStorage), never sent
// here. See implementation notes for the reasoning (IP-based tracking
// is unreliable behind shared NAT and adds privacy overhead for little
// benefit over localStorage).
type RecentView struct {
	ID            uuid.UUID `gorm:"type:uuid;primaryKey;default:gen_random_uuid()" json:"id"`
	UserID        uuid.UUID `gorm:"type:uuid;not null" json:"user_id"`
	EntityType    string    `gorm:"not null" json:"entity_type"` // "folder" | "menu_item"
	EntityID      uuid.UUID `gorm:"type:uuid;not null" json:"entity_id"`
	EntityName    string    `json:"entity_name"`
	ViewedAt      time.Time `json:"viewed_at"`
	EntityDeleted bool      `gorm:"-" json:"entity_deleted"`
}
