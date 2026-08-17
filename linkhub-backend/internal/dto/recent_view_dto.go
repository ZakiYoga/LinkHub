package dto

import "github.com/google/uuid"

type TrackRecentViewInput struct {
	EntityType string    `json:"entity_type" validate:"required,oneof=folder menu_item"`
	EntityID   uuid.UUID `json:"entity_id" validate:"required"`
	EntityName string    `json:"entity_name" validate:"required,max=255"`
}
