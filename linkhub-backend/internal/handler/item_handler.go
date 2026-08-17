package handler

import (
	"encoding/json"
	"errors"
	"net/http"
	"strconv"
	"strings"

	"github.com/go-chi/chi/v5"
	"github.com/go-playground/validator/v10"
	"github.com/google/uuid"
	"github.com/zaki/linkhub-backend/internal/dto"
	appmw "github.com/zaki/linkhub-backend/internal/middleware"
	"github.com/zaki/linkhub-backend/internal/service"
	"github.com/zaki/linkhub-backend/pkg/apperror"
	"github.com/zaki/linkhub-backend/pkg/response"
)

type ItemHandler struct {
	svc       *service.ItemService
	folderSvc *service.FolderService
	validate  *validator.Validate
}

func NewItemHandler(svc *service.ItemService, folderSvc *service.FolderService) *ItemHandler {
	return &ItemHandler{svc: svc, folderSvc: folderSvc, validate: validator.New()}
}

func parseTagIDs(raw string) []uuid.UUID {
	if raw == "" {
		return nil
	}
	parts := strings.Split(raw, ",")
	ids := make([]uuid.UUID, 0, len(parts))
	for _, p := range parts {
		if id, err := uuid.Parse(strings.TrimSpace(p)); err == nil {
			ids = append(ids, id)
		}
	}
	return ids
}

// List handles GET /api/v1/items?folder_id=&type=&tag=&sort=&page=&limit= (browse mode)
func (h *ItemHandler) List(w http.ResponseWriter, r *http.Request) {
	q := r.URL.Query()

	var folderID *uuid.UUID
	if raw := q.Get("folder_id"); raw != "" {
		id, err := uuid.Parse(raw)
		if err != nil {
			response.ErrorMsg(w, http.StatusBadRequest, "folder_id tidak valid")
			return
		}
		folderID = &id
	}

	page, _ := strconv.Atoi(q.Get("page"))
	limit, _ := strconv.Atoi(q.Get("limit"))

	filter := dto.ItemFilter{
		FolderID: folderID,
		Type:     q.Get("type"),
		TagIDs:   parseTagIDs(q.Get("tag")),
		Sort:     q.Get("sort"),
		Page:     page,
		Limit:    limit,
	}

	actor, _ := appmw.GetAuthUser(r.Context())
	items, total, err := h.svc.List(r.Context(), filter, actor, r.Header.Get("X-Folder-Pin-Token"))
	if err != nil {
		var pinErr *apperror.PinRequiredError
		if errors.As(err, &pinErr) {
			response.ErrorWithData(w, http.StatusForbidden, pinErr.Message, map[string]interface{}{
				"pin_required": true,
				"folder_name":  pinErr.FolderName,
			})
			return
		}
		response.Error(w, http.StatusInternalServerError, err)
		return
	}

	response.JSON(w, http.StatusOK, map[string]interface{}{
		"items": items,
		"total": total,
		"page":  filter.Page,
		"limit": filter.Limit,
	})
}

// Search handles GET /api/v1/search?q=&type=&tag=&page=&limit= (global search mode)
func (h *ItemHandler) Search(w http.ResponseWriter, r *http.Request) {
	q := r.URL.Query()
	page, _ := strconv.Atoi(q.Get("page"))
	limit, _ := strconv.Atoi(q.Get("limit"))

	filter := dto.SearchFilter{
		Query:  q.Get("q"),
		Type:   q.Get("type"),
		TagIDs: parseTagIDs(q.Get("tag")),
		Page:   page,
		Limit:  limit,
	}

	results, total, err := h.svc.Search(r.Context(), filter, h.folderSvc)
	if err != nil {
		response.Error(w, http.StatusInternalServerError, err)
		return
	}
	response.JSON(w, http.StatusOK, map[string]interface{}{
		"items": results,
		"total": total,
		"page":  filter.Page,
		"limit": filter.Limit,
	})
}

func (h *ItemHandler) GetByID(w http.ResponseWriter, r *http.Request) {
	id, err := uuid.Parse(chi.URLParam(r, "id"))
	if err != nil {
		response.ErrorMsg(w, http.StatusBadRequest, "id tidak valid")
		return
	}
	item, err := h.svc.GetByID(r.Context(), id)
	if err != nil {
		response.Error(w, http.StatusNotFound, err)
		return
	}
	response.JSON(w, http.StatusOK, item)
}

func (h *ItemHandler) Create(w http.ResponseWriter, r *http.Request) {
	var in dto.CreateItemInput
	if err := json.NewDecoder(r.Body).Decode(&in); err != nil {
		response.ErrorMsg(w, http.StatusBadRequest, "body tidak valid")
		return
	}
	if err := h.validate.Struct(in); err != nil {
		response.ErrorMsg(w, http.StatusBadRequest, err.Error())
		return
	}

	actor, _ := appmw.GetAuthUser(r.Context())
	item, err := h.svc.Create(r.Context(), in, actor)
	if err != nil {
		response.Error(w, http.StatusInternalServerError, err)
		return
	}
	response.JSON(w, http.StatusCreated, item)
}

func (h *ItemHandler) Update(w http.ResponseWriter, r *http.Request) {
	id, err := uuid.Parse(chi.URLParam(r, "id"))
	if err != nil {
		response.ErrorMsg(w, http.StatusBadRequest, "id tidak valid")
		return
	}

	var in dto.UpdateItemInput
	if err := json.NewDecoder(r.Body).Decode(&in); err != nil {
		response.ErrorMsg(w, http.StatusBadRequest, "body tidak valid")
		return
	}
	if err := h.validate.Struct(in); err != nil {
		response.ErrorMsg(w, http.StatusBadRequest, err.Error())
		return
	}

	actor, _ := appmw.GetAuthUser(r.Context())
	item, err := h.svc.Update(r.Context(), id, in, actor)
	if err != nil {
		response.Error(w, http.StatusInternalServerError, err)
		return
	}
	response.JSON(w, http.StatusOK, item)
}

func (h *ItemHandler) Delete(w http.ResponseWriter, r *http.Request) {
	id, err := uuid.Parse(chi.URLParam(r, "id"))
	if err != nil {
		response.ErrorMsg(w, http.StatusBadRequest, "id tidak valid")
		return
	}
	actor, _ := appmw.GetAuthUser(r.Context())
	if err := h.svc.Delete(r.Context(), id, actor); err != nil {
		response.Error(w, http.StatusInternalServerError, err)
		return
	}
	response.JSON(w, http.StatusOK, map[string]string{"message": "item dihapus"})
}

// --- Trash / restore (practical addition, not in the original design doc) ---

func (h *ItemHandler) ListDeleted(w http.ResponseWriter, r *http.Request) {
	actor, _ := appmw.GetAuthUser(r.Context())
	items, err := h.svc.ListDeleted(r.Context(), actor)
	if err != nil {
		response.Error(w, http.StatusInternalServerError, err)
		return
	}
	response.JSON(w, http.StatusOK, items)
}

func (h *ItemHandler) Restore(w http.ResponseWriter, r *http.Request) {
	id, err := uuid.Parse(chi.URLParam(r, "id"))
	if err != nil {
		response.ErrorMsg(w, http.StatusBadRequest, "id tidak valid")
		return
	}
	actor, _ := appmw.GetAuthUser(r.Context())
	if err := h.svc.Restore(r.Context(), id, actor); err != nil {
		response.Error(w, http.StatusInternalServerError, err)
		return
	}
	response.JSON(w, http.StatusOK, map[string]string{"message": "item dipulihkan"})
}
