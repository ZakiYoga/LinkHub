package handler

import (
	"encoding/json"
	"net/http"

	"github.com/go-playground/validator/v10"
	"github.com/zaki/linkhub-backend/internal/service"
	"github.com/zaki/linkhub-backend/pkg/response"
)

type AuthHandler struct {
	svc      *service.AuthService
	validate *validator.Validate
}

func NewAuthHandler(svc *service.AuthService) *AuthHandler {
	return &AuthHandler{svc: svc, validate: validator.New()}
}

type loginRequest struct {
	Username string `json:"username" validate:"required"`
	Password string `json:"password" validate:"required"`
}

func (h *AuthHandler) Login(w http.ResponseWriter, r *http.Request) {
	var req loginRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		response.ErrorMsg(w, http.StatusBadRequest, "body tidak valid")
		return
	}
	if err := h.validate.Struct(req); err != nil {
		response.ErrorMsg(w, http.StatusBadRequest, "username dan password wajib diisi")
		return
	}

	token, err := h.svc.Login(r.Context(), req.Username, req.Password)
	if err != nil {
		response.Error(w, http.StatusUnauthorized, err)
		return
	}

	response.JSON(w, http.StatusOK, map[string]string{"token": token})
}
