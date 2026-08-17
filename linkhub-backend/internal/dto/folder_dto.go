package dto

import "github.com/google/uuid"

type CreateFolderInput struct {
	Name     string     `json:"name" validate:"required,min=1,max=255"`
	ParentID *uuid.UUID `json:"parent_id"`
}

type UpdateFolderInput struct {
	Name     *string    `json:"name" validate:"omitempty,min=1,max=255"`
	ParentID *uuid.UUID `json:"parent_id"`
}

type FolderSummary struct {
	SubfolderCount int64 `json:"subfolder_count"`
	ItemCount      int64 `json:"item_count"`
}

// BlockingEntity describes one piece of content that's stopping a
// folder delete because it belongs to someone other than the folder's
// owner (design doc section 7). Returned as the 409 response body so
// the frontend can show the user exactly what's in the way.
type BlockingEntity struct {
	Type      string    `json:"type"` // "folder" | "menu_item"
	ID        uuid.UUID `json:"id"`
	Name      string    `json:"name"`
	CreatedBy uuid.UUID `json:"created_by"`
}

type AddCollaboratorInput struct {
	UserID uuid.UUID `json:"user_id" validate:"required"`
}

// PIN-folder DTOs (not in the original design doc text).
type SetPinInput struct {
	Pin string `json:"pin" validate:"required,min=4,max=6,numeric"`
}

type VerifyPinInput struct {
	Pin string `json:"pin" validate:"required,min=4,max=6,numeric"`
}
