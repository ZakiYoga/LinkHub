package model

import (
	"time"

	"github.com/google/uuid"
)

type Folder struct {
	ID        uuid.UUID  `gorm:"type:uuid;primaryKey;default:gen_random_uuid()" json:"id"`
	Name      string     `gorm:"not null" json:"name"`
	ParentID  *uuid.UUID `gorm:"type:uuid;index" json:"parent_id"`
	CreatedBy uuid.UUID  `gorm:"type:uuid" json:"created_by"`
	UpdatedBy *uuid.UUID `gorm:"type:uuid" json:"updated_by"`
	CreatedAt time.Time  `json:"created_at"`
	UpdatedAt time.Time  `json:"updated_at"`

	DeletedAt *time.Time `json:"deleted_at,omitempty"`
	DeletedBy *uuid.UUID `gorm:"type:uuid" json:"deleted_by,omitempty"`

	// PinHash is the bcrypt hash of an optional PIN protecting this
	// folder's contents from guests (and any non-owner/collaborator).
	// nil means unprotected. Never exposed directly in JSON — the API
	// only ever tells the client WHETHER a folder is protected
	// (PinProtected), never the hash.
	PinHash *string `gorm:"column:pin_hash" json:"-"`

	// PinProtected is computed by the service layer after fetch
	// (gorm:"-" means GORM never reads/writes this column itself), so
	// list/detail responses can show a lock icon without ever touching
	// PinHash.
	PinProtected bool `gorm:"-" json:"pin_protected"`
}
