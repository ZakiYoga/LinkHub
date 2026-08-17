package router

import (
	"net/http"

	"github.com/go-chi/chi/v5"
	"github.com/go-chi/cors"
	"github.com/zaki/linkhub-backend/internal/config"
	"github.com/zaki/linkhub-backend/internal/handler"
	appmw "github.com/zaki/linkhub-backend/internal/middleware"
)

type Handlers struct {
	Auth       *handler.AuthHandler
	Folder     *handler.FolderHandler
	Item       *handler.ItemHandler
	Tag        *handler.TagHandler
	User       *handler.UserHandler
	RecentView *handler.RecentViewHandler
}

// New wires every route from the design doc's API table (section 6),
// extended per the role/ownership/collaborator doc (section 8/9):
// public GET routes use OptionalAuth (never reject, just may populate
// actor context); create/edit/delete routes require ANY logged-in role
// via RequireAuth, with ownership enforced inside the service layer;
// admin-only routes (tags, user management) still use RequireAdmin.
func New(cfg *config.Config, h Handlers) http.Handler {
	r := chi.NewRouter()

	r.Use(appmw.Logger)
	r.Use(cors.Handler(cors.Options{
		AllowedOrigins:   []string{cfg.CORSOrigin},
		AllowedMethods:   []string{"GET", "POST", "PATCH", "DELETE", "OPTIONS"},
		AllowedHeaders:   []string{"Accept", "Content-Type", "Authorization", "X-Folder-Pin-Token"},
		AllowCredentials: true,
	}))

	optionalAuth := appmw.OptionalAuth(cfg.JWTSecret)
	requireAuth := appmw.RequireAuth(cfg.JWTSecret)
	requireAdmin := appmw.RequireAdmin(cfg.JWTSecret)

	r.Get("/healthz", func(w http.ResponseWriter, r *http.Request) {
		w.WriteHeader(http.StatusOK)
		_, _ = w.Write([]byte("ok"))
	})

	r.Route("/api/v1", func(r chi.Router) {
		r.Post("/auth/login", h.Auth.Login)

		// Public group: guests browse freely, never rejected. Optional
		// auth just lets a logged-in viewer be recognized if they happen
		// to be authenticated. verify-pin is here too — guests need to
		// unlock PIN-protected folders without logging in.
		r.Group(func(r chi.Router) {
			r.Use(optionalAuth)

			r.Get("/folders", h.Folder.List)
			r.Get("/folders/{id}", h.Folder.GetByID)
			r.Post("/folders/{id}/verify-pin", h.Folder.VerifyPin)
			r.Get("/items", h.Item.List)
			r.Get("/search", h.Item.Search)
			r.Get("/tags", h.Tag.List)
		})

		// Any logged-in user (staff or admin). Ownership/collaborator
		// checks happen inside the service layer, not here.
		r.Group(func(r chi.Router) {
			r.Use(requireAuth)

			r.Get("/folders/deleted", h.Folder.ListDeleted)
			r.Get("/folders/{id}/summary", h.Folder.Summary)
			r.Post("/folders", h.Folder.Create)
			r.Patch("/folders/{id}", h.Folder.Update)
			r.Delete("/folders/{id}", h.Folder.Delete)
			r.Post("/folders/{id}/restore", h.Folder.Restore)
			r.Post("/folders/{id}/pin", h.Folder.SetPin)
			r.Delete("/folders/{id}/pin", h.Folder.RemovePin)

			r.Get("/folders/{id}/collaborators", h.Folder.ListCollaborators)
			r.Post("/folders/{id}/collaborators", h.Folder.AddCollaborator)
			r.Delete("/folders/{id}/collaborators/{userId}", h.Folder.RemoveCollaborator)

			r.Get("/items/deleted", h.Item.ListDeleted)
			r.Get("/items/{id}", h.Item.GetByID)
			r.Post("/items", h.Item.Create)
			r.Patch("/items/{id}", h.Item.Update)
			r.Delete("/items/{id}", h.Item.Delete)
			r.Post("/items/{id}/restore", h.Item.Restore)

			// GET /users is deliberately here (any logged-in user), not
			// admin-only: a non-admin folder owner still needs to see
			// usernames to pick who to add as a collaborator. Only
			// id/username/role are exposed (see UserHandler.List), never
			// password_hash, so this is a low-risk relaxation — flagged
			// since it widens the original admin-only assumption.
			r.Get("/users", h.User.List)

			r.Post("/recent-views", h.RecentView.Track)
			r.Get("/recent-views", h.RecentView.List)
		})

		// Admin-only.
		r.Group(func(r chi.Router) {
			r.Use(requireAdmin)

			r.Post("/tags", h.Tag.Create)
			r.Patch("/tags/{id}", h.Tag.Update)
			r.Delete("/tags/{id}", h.Tag.Delete)

			r.Post("/users", h.User.Create)
		})
	})

	return r
}
