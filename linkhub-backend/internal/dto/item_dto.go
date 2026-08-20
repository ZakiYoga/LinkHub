package dto

import (
	"github.com/google/uuid"
	"github.com/zaki/linkhub-backend/internal/model"
)

type CreateItemInput struct {
	Name        string         `json:"name" validate:"required,min=1,max=255"`
	URL         string         `json:"url" validate:"required,url"`
	Type        model.ItemType `json:"type" validate:"required,oneof=spreadsheet slides drive document form other"`
	FolderID    *uuid.UUID     `json:"folder_id"`
	Description string         `json:"description" validate:"max=500"`
	TagIDs      []uuid.UUID    `json:"tag_ids"`
}

type UpdateItemInput struct {
	Name        *string         `json:"name" validate:"omitempty,min=1,max=255"`
	URL         *string         `json:"url" validate:"omitempty,url"`
	Type        *model.ItemType `json:"type" validate:"omitempty,oneof=spreadsheet slides drive document form other"`
	FolderID    *uuid.UUID      `json:"folder_id"`
	Description *string         `json:"description" validate:"omitempty,max=500"`
	TagIDs      []uuid.UUID     `json:"tag_ids"`
}

// ItemFilter is used for mode "browse": listing items inside one folder.
type ItemFilter struct {
	FolderID *uuid.UUID
	Type     string
	TagIDs   []uuid.UUID
	Sort     string // "name" | "newest"
	Page     int
	Limit    int

	OwnerScope string
	ActorID    *uuid.UUID
}

// SearchFilter is used for mode "search": global search across all folders.
type SearchFilter struct {
	Query  string
	Type   string
	TagIDs []uuid.UUID
	Page   int
	Limit  int

	// See ItemFilter.OwnerScope / Actor ID for semantics
	OwnerScope string
	ActorID    *uuid.UUID
}

type SearchResultItem struct {
	model.MenuItem
	Breadcrumb []model.Folder `json:"breadcrumb"`
}
