// Note: user_dto.go isn't part of the design doc. The doc introduces
// the "staff" role but doesn't specify how staff accounts get created —
// the original design only ever seeds a single admin with no register
// endpoint. Without SOME way to create additional users, the staff role
// is unusable, so this is a minimal admin-only user management API
// filling that gap. Flagged explicitly rather than silently added.
package dto

import "github.com/zaki/linkhub-backend/internal/model"

type CreateUserInput struct {
	Username string         `json:"username" validate:"required,min=3,max=255"`
	Password string         `json:"password" validate:"required,min=6"`
	Role     model.UserRole `json:"role" validate:"required,oneof=admin staff"`
}
