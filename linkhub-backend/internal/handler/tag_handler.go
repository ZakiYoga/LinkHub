package handler

import (
	"encoding/json"
	"net/http"

	"github.com/go-chi/chi/v5"
	"github.com/go-playground/validator/v10"
	"github.com/google/uuid"
	"github.com/zaki/linkhub-backend/internal/service"
	"github.com/zaki/linkhub-backend/pkg/response"
)

type TagHandler struct {
	svc      *service.TagService
	validate *validator.Validate
}

func NewTagHandler(svc *service.TagService) *TagHandler {
	return &TagHandler{svc: svc, validate: validator.New()}
}

type tagRequest struct {
	Name string `json:"name" validate:"required,min=1,max=100"`
}

func (h *TagHandler) List(w http.ResponseWriter, r *http.Request) {
	tags, err := h.svc.List(r.Context())
	if err != nil {
		response.Error(w, http.StatusInternalServerError, err)
		return
	}
	response.JSON(w, http.StatusOK, tags)
}

func (h *TagHandler) Create(w http.ResponseWriter, r *http.Request) {
	var req tagRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		response.ErrorMsg(w, http.StatusBadRequest, "body tidak valid")
		return
	}
	if err := h.validate.Struct(req); err != nil {
		response.ErrorMsg(w, http.StatusBadRequest, err.Error())
		return
	}

	tag, err := h.svc.Create(r.Context(), req.Name)
	if err != nil {
		response.Error(w, http.StatusInternalServerError, err)
		return
	}
	response.JSON(w, http.StatusCreated, tag)
}

func (h *TagHandler) Update(w http.ResponseWriter, r *http.Request) {
	id, err := uuid.Parse(chi.URLParam(r, "id"))
	if err != nil {
		response.ErrorMsg(w, http.StatusBadRequest, "id tidak valid")
		return
	}

	var req tagRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		response.ErrorMsg(w, http.StatusBadRequest, "body tidak valid")
		return
	}
	if err := h.validate.Struct(req); err != nil {
		response.ErrorMsg(w, http.StatusBadRequest, err.Error())
		return
	}

	tag, err := h.svc.Update(r.Context(), id, req.Name)
	if err != nil {
		response.Error(w, http.StatusInternalServerError, err)
		return
	}
	response.JSON(w, http.StatusOK, tag)
}

func (h *TagHandler) Delete(w http.ResponseWriter, r *http.Request) {
	id, err := uuid.Parse(chi.URLParam(r, "id"))
	if err != nil {
		response.ErrorMsg(w, http.StatusBadRequest, "id tidak valid")
		return
	}
	if err := h.svc.Delete(r.Context(), id); err != nil {
		response.Error(w, http.StatusInternalServerError, err)
		return
	}
	response.JSON(w, http.StatusOK, map[string]string{"message": "tag dihapus"})
}
