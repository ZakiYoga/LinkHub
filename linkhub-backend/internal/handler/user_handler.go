package handler

import (
	"encoding/json"
	"net/http"

	"github.com/go-playground/validator/v10"
	"github.com/zaki/linkhub-backend/internal/dto"
	"github.com/zaki/linkhub-backend/internal/service"
	"github.com/zaki/linkhub-backend/pkg/response"
)

type UserHandler struct {
	svc      *service.UserService
	validate *validator.Validate
}

func NewUserHandler(svc *service.UserService) *UserHandler {
	return &UserHandler{svc: svc, validate: validator.New()}
}

// List returns id/username/role for every user — used by the frontend
// to populate the "add collaborator" picker (admin-only route, since it
// exposes the full user list).
func (h *UserHandler) List(w http.ResponseWriter, r *http.Request) {
	users, err := h.svc.List(r.Context())
	if err != nil {
		response.Error(w, http.StatusInternalServerError, err)
		return
	}
	response.JSON(w, http.StatusOK, users)
}

func (h *UserHandler) Create(w http.ResponseWriter, r *http.Request) {
	var in dto.CreateUserInput
	if err := json.NewDecoder(r.Body).Decode(&in); err != nil {
		response.ErrorMsg(w, http.StatusBadRequest, "body tidak valid")
		return
	}
	if err := h.validate.Struct(in); err != nil {
		response.ErrorMsg(w, http.StatusBadRequest, err.Error())
		return
	}

	user, err := h.svc.Create(r.Context(), in)
	if err != nil {
		response.Error(w, http.StatusInternalServerError, err)
		return
	}
	response.JSON(w, http.StatusCreated, user)
}
