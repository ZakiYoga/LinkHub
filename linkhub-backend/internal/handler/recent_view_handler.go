package handler

import (
	"encoding/json"
	"net/http"

	"github.com/go-playground/validator/v10"
	"github.com/zaki/linkhub-backend/internal/dto"
	appmw "github.com/zaki/linkhub-backend/internal/middleware"
	"github.com/zaki/linkhub-backend/internal/service"
	"github.com/zaki/linkhub-backend/pkg/response"
)

type RecentViewHandler struct {
	svc      *service.RecentViewService
	validate *validator.Validate
}

func NewRecentViewHandler(svc *service.RecentViewService) *RecentViewHandler {
	return &RecentViewHandler{svc: svc, validate: validator.New()}
}

// Track handles POST /api/v1/recent-views — called by the frontend
// whenever a logged-in user opens a folder or clicks an item.
func (h *RecentViewHandler) Track(w http.ResponseWriter, r *http.Request) {
	var in dto.TrackRecentViewInput
	if err := json.NewDecoder(r.Body).Decode(&in); err != nil {
		response.ErrorMsg(w, http.StatusBadRequest, "body tidak valid")
		return
	}
	if err := h.validate.Struct(in); err != nil {
		response.ErrorMsg(w, http.StatusBadRequest, err.Error())
		return
	}

	actor, _ := appmw.GetAuthUser(r.Context())
	if err := h.svc.Track(r.Context(), actor, in.EntityType, in.EntityID, in.EntityName); err != nil {
		response.Error(w, http.StatusInternalServerError, err)
		return
	}
	response.JSON(w, http.StatusOK, map[string]string{"message": "tercatat"})
}

func (h *RecentViewHandler) List(w http.ResponseWriter, r *http.Request) {
	actor, _ := appmw.GetAuthUser(r.Context())
	rows, err := h.svc.List(r.Context(), actor)
	if err != nil {
		response.Error(w, http.StatusInternalServerError, err)
		return
	}
	response.JSON(w, http.StatusOK, rows)
}
