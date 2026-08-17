// Package authctx holds the AuthUser type shared between the
// middleware layer (which parses it out of the JWT) and the service
// layer (which uses it for permission checks). It lives in its own
// package with no dependency on either, specifically to avoid a
// middleware <-> service import cycle: middleware already imports
// service for service.Claims, so AuthUser can't live in either package
// without creating a loop.
package authctx

import (
	"github.com/google/uuid"
	"github.com/zaki/linkhub-backend/internal/model"
)

type AuthUser struct {
	ID   uuid.UUID
	Role model.UserRole
}

func (u *AuthUser) IsAdmin() bool {
	return u != nil && u.Role == model.RoleAdmin
}
