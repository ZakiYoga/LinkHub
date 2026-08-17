package middleware

import (
	"context"
	"net/http"
	"strings"

	"github.com/golang-jwt/jwt/v5"
	"github.com/google/uuid"
	"github.com/zaki/linkhub-backend/internal/authctx"
	"github.com/zaki/linkhub-backend/internal/model"
	"github.com/zaki/linkhub-backend/internal/service"
	"github.com/zaki/linkhub-backend/pkg/response"
)

type ctxKey string

const userCtxKey ctxKey = "authUser"

// parseToken shares the actual JWT verification between all three
// middlewares below, so the "valid signature + not expired" logic only
// lives in one place.
func parseToken(r *http.Request, jwtSecret string) (*authctx.AuthUser, bool) {
	tokenStr := extractBearerToken(r)
	if tokenStr == "" {
		return nil, false
	}

	claims := &service.Claims{}
	token, err := jwt.ParseWithClaims(tokenStr, claims, func(t *jwt.Token) (interface{}, error) {
		return []byte(jwtSecret), nil
	})
	if err != nil || !token.Valid {
		return nil, false
	}

	id, err := uuid.Parse(claims.Sub)
	if err != nil {
		return nil, false
	}

	return &authctx.AuthUser{ID: id, Role: model.UserRole(claims.Role)}, true
}

func extractBearerToken(r *http.Request) string {
	header := r.Header.Get("Authorization")
	if header == "" {
		return ""
	}
	parts := strings.SplitN(header, " ", 2)
	if len(parts) != 2 || strings.ToLower(parts[0]) != "bearer" {
		return ""
	}
	return parts[1]
}

// OptionalAuth is for public routes (browse/search): if a valid token
// is present, the request context is populated with an *AuthUser; if
// not, the request proceeds anonymously instead of being rejected
// (design doc section 8). Handlers that need to know "is this a guest
// or a logged-in user" read via GetAuthUser.
func OptionalAuth(jwtSecret string) func(http.Handler) http.Handler {
	return func(next http.Handler) http.Handler {
		return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			if user, ok := parseToken(r, jwtSecret); ok {
				ctx := context.WithValue(r.Context(), userCtxKey, user)
				r = r.WithContext(ctx)
			}
			next.ServeHTTP(w, r)
		})
	}
}

// RequireAuth is for mutating routes (create/edit/delete) that any
// logged-in role (staff or admin) may attempt — the actual ownership/
// collaborator check happens in the service layer, not here.
func RequireAuth(jwtSecret string) func(http.Handler) http.Handler {
	return func(next http.Handler) http.Handler {
		return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			user, ok := parseToken(r, jwtSecret)
			if !ok {
				response.ErrorMsg(w, http.StatusUnauthorized, "unauthorized")
				return
			}
			ctx := context.WithValue(r.Context(), userCtxKey, user)
			next.ServeHTTP(w, r.WithContext(ctx))
		})
	}
}

// RequireAdmin is for routes only the admin role may ever touch
// (tag management, user management, force-delete).
func RequireAdmin(jwtSecret string) func(http.Handler) http.Handler {
	return func(next http.Handler) http.Handler {
		return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			user, ok := parseToken(r, jwtSecret)
			if !ok || user.Role != model.RoleAdmin {
				response.ErrorMsg(w, http.StatusUnauthorized, "unauthorized")
				return
			}
			ctx := context.WithValue(r.Context(), userCtxKey, user)
			next.ServeHTTP(w, r.WithContext(ctx))
		})
	}
}

func GetAuthUser(ctx context.Context) (*authctx.AuthUser, bool) {
	user, ok := ctx.Value(userCtxKey).(*authctx.AuthUser)
	return user, ok
}
