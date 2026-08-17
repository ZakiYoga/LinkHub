package handler

import (
	"encoding/json"
	"errors"
	"fmt"
	"net"
	"net/http"
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

type FolderHandler struct {
	svc        *service.FolderService
	validate   *validator.Validate
	pinLimiter *service.PinRateLimiter
}

func NewFolderHandler(svc *service.FolderService) *FolderHandler {
	return &FolderHandler{svc: svc, validate: validator.New(), pinLimiter: service.NewPinRateLimiter()}
}

// respondFolderError distinguishes a PIN-required 403 (structured body
// the frontend can act on) from every other error, which falls back to
// the generic envelope.
func respondFolderError(w http.ResponseWriter, err error) {
	var pinErr *apperror.PinRequiredError
	if errors.As(err, &pinErr) {
		response.ErrorWithData(w, http.StatusForbidden, pinErr.Message, map[string]interface{}{
			"pin_required": true,
			"folder_name":  pinErr.FolderName,
		})
		return
	}
	response.Error(w, http.StatusInternalServerError, err)
}

func unlockTokenFromHeader(r *http.Request) string {
	return r.Header.Get("X-Folder-Pin-Token")
}

// List handles GET /api/v1/folders?parent_id=  (single-level browse mode, public)
func (h *FolderHandler) List(w http.ResponseWriter, r *http.Request) {
	var parentID *uuid.UUID
	if raw := r.URL.Query().Get("parent_id"); raw != "" {
		id, err := uuid.Parse(raw)
		if err != nil {
			response.ErrorMsg(w, http.StatusBadRequest, "parent_id tidak valid")
			return
		}
		parentID = &id
	}

	actor, _ := appmw.GetAuthUser(r.Context())
	folders, err := h.svc.ListChildren(r.Context(), parentID, actor, unlockTokenFromHeader(r))
	if err != nil {
		respondFolderError(w, err)
		return
	}
	response.JSON(w, http.StatusOK, folders)
}

// GetByID handles GET /api/v1/folders/{id} -> folder detail + breadcrumb (public)
func (h *FolderHandler) GetByID(w http.ResponseWriter, r *http.Request) {
	id, err := uuid.Parse(chi.URLParam(r, "id"))
	if err != nil {
		response.ErrorMsg(w, http.StatusBadRequest, "id tidak valid")
		return
	}

	actor, _ := appmw.GetAuthUser(r.Context())
	folder, err := h.svc.GetByID(r.Context(), id, actor, unlockTokenFromHeader(r))
	if err != nil {
		respondFolderError(w, err)
		return
	}

	breadcrumb, err := h.svc.BuildBreadcrumb(r.Context(), id)
	if err != nil {
		response.Error(w, http.StatusInternalServerError, err)
		return
	}

	response.JSON(w, http.StatusOK, map[string]interface{}{
		"folder":     folder,
		"breadcrumb": breadcrumb,
	})
}

// Summary handles GET /api/v1/folders/{id}/summary (any logged-in user,
// section 16.6 — also used as the delete-guard preview for owners).
func (h *FolderHandler) Summary(w http.ResponseWriter, r *http.Request) {
	id, err := uuid.Parse(chi.URLParam(r, "id"))
	if err != nil {
		response.ErrorMsg(w, http.StatusBadRequest, "id tidak valid")
		return
	}

	summary, err := h.svc.Summary(r.Context(), id)
	if err != nil {
		response.Error(w, http.StatusInternalServerError, err)
		return
	}
	response.JSON(w, http.StatusOK, summary)
}

func (h *FolderHandler) Create(w http.ResponseWriter, r *http.Request) {
	var in dto.CreateFolderInput
	if err := json.NewDecoder(r.Body).Decode(&in); err != nil {
		response.ErrorMsg(w, http.StatusBadRequest, "body tidak valid")
		return
	}
	if err := h.validate.Struct(in); err != nil {
		response.ErrorMsg(w, http.StatusBadRequest, err.Error())
		return
	}

	actor, _ := appmw.GetAuthUser(r.Context())
	folder, err := h.svc.Create(r.Context(), in, actor)
	if err != nil {
		response.Error(w, http.StatusInternalServerError, err)
		return
	}
	response.JSON(w, http.StatusCreated, folder)
}

func (h *FolderHandler) Update(w http.ResponseWriter, r *http.Request) {
	id, err := uuid.Parse(chi.URLParam(r, "id"))
	if err != nil {
		response.ErrorMsg(w, http.StatusBadRequest, "id tidak valid")
		return
	}

	var in dto.UpdateFolderInput
	if err := json.NewDecoder(r.Body).Decode(&in); err != nil {
		response.ErrorMsg(w, http.StatusBadRequest, "body tidak valid")
		return
	}
	if err := h.validate.Struct(in); err != nil {
		response.ErrorMsg(w, http.StatusBadRequest, err.Error())
		return
	}

	actor, _ := appmw.GetAuthUser(r.Context())
	folder, err := h.svc.Update(r.Context(), id, in, actor)
	if err != nil {
		response.Error(w, http.StatusInternalServerError, err)
		return
	}
	response.JSON(w, http.StatusOK, folder)
}

// Delete handles DELETE /api/v1/folders/{id}?force=true. force is only
// honored when the actor is admin (checked in the service); for
// everyone else it's silently ignored. On 409, the response body's
// `error.blocking` field lists what's stopping the delete (section 7).
func (h *FolderHandler) Delete(w http.ResponseWriter, r *http.Request) {
	id, err := uuid.Parse(chi.URLParam(r, "id"))
	if err != nil {
		response.ErrorMsg(w, http.StatusBadRequest, "id tidak valid")
		return
	}
	force := r.URL.Query().Get("force") == "true"

	actor, _ := appmw.GetAuthUser(r.Context())
	blocking, err := h.svc.Delete(r.Context(), id, actor, force)
	if err != nil {
		if len(blocking) > 0 {
			response.ErrorWithData(w, http.StatusConflict, "folder berisi konten milik user lain", map[string]interface{}{
				"blocking": blocking,
			})
			return
		}
		response.Error(w, http.StatusInternalServerError, err)
		return
	}
	response.JSON(w, http.StatusOK, map[string]string{"message": "folder dihapus"})
}

// --- Trash / restore (practical addition, not in the original design doc) ---

func (h *FolderHandler) ListDeleted(w http.ResponseWriter, r *http.Request) {
	actor, _ := appmw.GetAuthUser(r.Context())
	folders, err := h.svc.ListDeleted(r.Context(), actor)
	if err != nil {
		response.Error(w, http.StatusInternalServerError, err)
		return
	}
	response.JSON(w, http.StatusOK, folders)
}

func (h *FolderHandler) Restore(w http.ResponseWriter, r *http.Request) {
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
	response.JSON(w, http.StatusOK, map[string]string{"message": "folder dipulihkan"})
}

// --- Collaborator endpoints (design doc section 5) ---

func (h *FolderHandler) ListCollaborators(w http.ResponseWriter, r *http.Request) {
	id, err := uuid.Parse(chi.URLParam(r, "id"))
	if err != nil {
		response.ErrorMsg(w, http.StatusBadRequest, "id tidak valid")
		return
	}
	actor, _ := appmw.GetAuthUser(r.Context())
	list, err := h.svc.ListCollaborators(r.Context(), id, actor)
	if err != nil {
		response.Error(w, http.StatusInternalServerError, err)
		return
	}
	response.JSON(w, http.StatusOK, list)
}

func (h *FolderHandler) AddCollaborator(w http.ResponseWriter, r *http.Request) {
	id, err := uuid.Parse(chi.URLParam(r, "id"))
	if err != nil {
		response.ErrorMsg(w, http.StatusBadRequest, "id tidak valid")
		return
	}

	var in dto.AddCollaboratorInput
	if err := json.NewDecoder(r.Body).Decode(&in); err != nil {
		response.ErrorMsg(w, http.StatusBadRequest, "body tidak valid")
		return
	}
	if err := h.validate.Struct(in); err != nil {
		response.ErrorMsg(w, http.StatusBadRequest, err.Error())
		return
	}

	actor, _ := appmw.GetAuthUser(r.Context())
	if err := h.svc.AddCollaborator(r.Context(), id, in.UserID, actor); err != nil {
		response.Error(w, http.StatusInternalServerError, err)
		return
	}
	response.JSON(w, http.StatusCreated, map[string]string{"message": "kolaborator ditambahkan"})
}

func (h *FolderHandler) RemoveCollaborator(w http.ResponseWriter, r *http.Request) {
	id, err := uuid.Parse(chi.URLParam(r, "id"))
	if err != nil {
		response.ErrorMsg(w, http.StatusBadRequest, "id tidak valid")
		return
	}
	userID, err := uuid.Parse(chi.URLParam(r, "userId"))
	if err != nil {
		response.ErrorMsg(w, http.StatusBadRequest, "userId tidak valid")
		return
	}

	actor, _ := appmw.GetAuthUser(r.Context())
	if err := h.svc.RemoveCollaborator(r.Context(), id, userID, actor); err != nil {
		response.Error(w, http.StatusInternalServerError, err)
		return
	}
	response.JSON(w, http.StatusOK, map[string]string{"message": "kolaborator dihapus"})
}

// --- PIN endpoints (not in the original design doc text) ---

func (h *FolderHandler) SetPin(w http.ResponseWriter, r *http.Request) {
	id, err := uuid.Parse(chi.URLParam(r, "id"))
	if err != nil {
		response.ErrorMsg(w, http.StatusBadRequest, "id tidak valid")
		return
	}

	var in dto.SetPinInput
	if err := json.NewDecoder(r.Body).Decode(&in); err != nil {
		response.ErrorMsg(w, http.StatusBadRequest, "body tidak valid")
		return
	}
	if err := h.validate.Struct(in); err != nil {
		response.ErrorMsg(w, http.StatusBadRequest, "PIN harus 4-6 digit angka")
		return
	}

	actor, _ := appmw.GetAuthUser(r.Context())
	if err := h.svc.SetPin(r.Context(), id, in.Pin, actor); err != nil {
		response.Error(w, http.StatusInternalServerError, err)
		return
	}
	response.JSON(w, http.StatusOK, map[string]string{"message": "PIN diatur"})
}

func (h *FolderHandler) RemovePin(w http.ResponseWriter, r *http.Request) {
	id, err := uuid.Parse(chi.URLParam(r, "id"))
	if err != nil {
		response.ErrorMsg(w, http.StatusBadRequest, "id tidak valid")
		return
	}
	actor, _ := appmw.GetAuthUser(r.Context())
	if err := h.svc.RemovePin(r.Context(), id, actor); err != nil {
		response.Error(w, http.StatusInternalServerError, err)
		return
	}
	response.JSON(w, http.StatusOK, map[string]string{"message": "PIN dihapus"})
}

// VerifyPin is public (no login required) — guests need to unlock
// protected folders too. On success, returns a short-lived unlock
// token the frontend stores (sessionStorage) and replays via the
// X-Folder-Pin-Token header on subsequent browse requests.
func (h *FolderHandler) VerifyPin(w http.ResponseWriter, r *http.Request) {
	id, err := uuid.Parse(chi.URLParam(r, "id"))
	if err != nil {
		response.ErrorMsg(w, http.StatusBadRequest, "id tidak valid")
		return
	}

	limitKey := id.String() + ":" + clientIP(r)
	if locked, remaining := h.pinLimiter.IsLocked(limitKey); locked {
		minutes := int(remaining.Minutes()) + 1
		response.ErrorMsg(w, http.StatusTooManyRequests,
			fmt.Sprintf("Terlalu banyak percobaan PIN salah. Coba lagi dalam %d menit.", minutes))
		return
	}

	var in dto.VerifyPinInput
	if err := json.NewDecoder(r.Body).Decode(&in); err != nil {
		response.ErrorMsg(w, http.StatusBadRequest, "body tidak valid")
		return
	}
	if err := h.validate.Struct(in); err != nil {
		response.ErrorMsg(w, http.StatusBadRequest, "PIN harus 4-6 digit angka")
		return
	}

	token, err := h.svc.VerifyPin(r.Context(), id, in.Pin)
	if err != nil {
		h.pinLimiter.RecordFailure(limitKey)
		response.Error(w, http.StatusUnauthorized, err)
		return
	}

	h.pinLimiter.RecordSuccess(limitKey)
	response.JSON(w, http.StatusOK, map[string]string{"unlock_token": token})
}

func clientIP(r *http.Request) string {
	if fwd := r.Header.Get("X-Forwarded-For"); fwd != "" {
		if parts := strings.Split(fwd, ","); len(parts) > 0 {
			return strings.TrimSpace(parts[0])
		}
	}
	host, _, err := net.SplitHostPort(r.RemoteAddr)
	if err != nil {
		return r.RemoteAddr
	}
	return host
}
