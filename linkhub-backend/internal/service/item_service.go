package service

import (
	"context"
	"net/url"
	"strings"

	"github.com/google/uuid"
	"github.com/zaki/linkhub-backend/internal/authctx"
	"github.com/zaki/linkhub-backend/internal/dto"
	"github.com/zaki/linkhub-backend/internal/model"
	"github.com/zaki/linkhub-backend/internal/repository"
	"github.com/zaki/linkhub-backend/pkg/apperror"
)

type ItemService struct {
	repo       repository.ItemRepository
	folderRepo repository.FolderRepository
	auditRepo  repository.AuditLogRepository
	perm       *PermissionService
}

func NewItemService(
	repo repository.ItemRepository,
	folderRepo repository.FolderRepository,
	auditRepo repository.AuditLogRepository,
	perm *PermissionService,
) *ItemService {
	return &ItemService{repo: repo, folderRepo: folderRepo, auditRepo: auditRepo, perm: perm}
}

func (s *ItemService) writeAudit(ctx context.Context, entityID uuid.UUID, entityName, action string, actorID uuid.UUID) {
	_ = s.auditRepo.Create(ctx, &model.AuditLog{
		EntityType: "menu_item",
		EntityID:   entityID,
		EntityName: entityName,
		Action:     action,
		ActorID:    actorID,
	})
}

// NormalizeURL strips a trailing slash from the path so that
// "https://x.com/doc/" and "https://x.com/doc" are treated as the same
// link before uniqueness is checked (section 16.8).
func NormalizeURL(raw string) (string, error) {
	u, err := url.Parse(strings.TrimSpace(raw))
	if err != nil {
		return "", err
	}
	u.Path = strings.TrimSuffix(u.Path, "/")
	return u.String(), nil
}

// Create requires access to the target folder (owner/collaborator/
// admin), same rule as FolderService.Create — creating at root (no
// folder_id) is open to any logged-in user.
func (s *ItemService) Create(ctx context.Context, in dto.CreateItemInput, actor *authctx.AuthUser) (*model.MenuItem, error) {
	if in.FolderID != nil {
		folder, err := s.folderRepo.FindByID(ctx, *in.FolderID)
		if err != nil {
			return nil, apperror.NotFound("folder tidak ditemukan")
		}
		allowed, err := s.perm.CanAccessFolder(ctx, actor, folder)
		if err != nil {
			return nil, apperror.Internal("gagal memeriksa akses")
		}
		if !allowed {
			return nil, apperror.Forbidden("tidak punya akses ke folder ini")
		}
	}

	normalized, err := NormalizeURL(in.URL)
	if err != nil {
		return nil, apperror.BadRequest("URL tidak valid")
	}

	exists, err := s.repo.ExistsByURL(ctx, normalized)
	if err != nil {
		return nil, apperror.Internal("gagal memvalidasi URL")
	}
	if exists {
		return nil, apperror.Conflict("URL ini sudah terdaftar di item lain")
	}

	item := &model.MenuItem{
		Name:        in.Name,
		URL:         normalized,
		Type:        in.Type,
		FolderID:    in.FolderID,
		Description: in.Description,
		CreatedBy:   actor.ID,
	}
	if err := s.repo.Create(ctx, item); err != nil {
		// Also caught by the partial unique index on a race condition.
		return nil, apperror.Conflict("URL ini sudah terdaftar di item lain")
	}
	if len(in.TagIDs) > 0 {
		if err := s.repo.SetTags(ctx, item, in.TagIDs); err != nil {
			return nil, apperror.Internal("gagal menyimpan tag")
		}
	}
	s.writeAudit(ctx, item.ID, item.Name, "created", actor.ID)
	return s.repo.FindByID(ctx, item.ID)
}

func (s *ItemService) GetByID(ctx context.Context, id uuid.UUID) (*model.MenuItem, error) {
	item, err := s.repo.FindByID(ctx, id)
	if err != nil {
		return nil, apperror.NotFound("item tidak ditemukan")
	}
	return item, nil
}

// Update requires CanEditItem — the item's own creator, or admin.
func (s *ItemService) Update(ctx context.Context, id uuid.UUID, in dto.UpdateItemInput, actor *authctx.AuthUser) (*model.MenuItem, error) {
	item, err := s.repo.FindByID(ctx, id)
	if err != nil {
		return nil, apperror.NotFound("item tidak ditemukan")
	}
	if !s.perm.CanEditItem(actor, item) {
		return nil, apperror.Forbidden("tidak punya akses untuk mengubah item ini")
	}

	if in.Name != nil {
		item.Name = *in.Name
	}
	if in.URL != nil {
		normalized, err := NormalizeURL(*in.URL)
		if err != nil {
			return nil, apperror.BadRequest("URL tidak valid")
		}
		if normalized != item.URL {
			exists, err := s.repo.ExistsByURL(ctx, normalized)
			if err != nil {
				return nil, apperror.Internal("gagal memvalidasi URL")
			}
			if exists {
				return nil, apperror.Conflict("URL ini sudah terdaftar di item lain")
			}
		}
		item.URL = normalized
	}
	if in.Type != nil {
		item.Type = *in.Type
	}
	if in.Description != nil {
		item.Description = *in.Description
	}
	item.FolderID = in.FolderID
	item.UpdatedBy = &actor.ID

	if err := s.repo.Update(ctx, item); err != nil {
		return nil, apperror.Internal("gagal update item")
	}
	if in.TagIDs != nil {
		if err := s.repo.SetTags(ctx, item, in.TagIDs); err != nil {
			return nil, apperror.Internal("gagal menyimpan tag")
		}
	}
	s.writeAudit(ctx, item.ID, item.Name, "updated", actor.ID)
	return s.repo.FindByID(ctx, id)
}

// Delete requires CanEditItem. Unlike folders, items don't nest, so
// there's no delete-guard/foreign-content check needed here — deleting
// an item never affects anyone else's content.
func (s *ItemService) Delete(ctx context.Context, id uuid.UUID, actor *authctx.AuthUser) error {
	item, err := s.repo.FindByID(ctx, id)
	if err != nil {
		return apperror.NotFound("item tidak ditemukan")
	}
	if !s.perm.CanEditItem(actor, item) {
		return apperror.Forbidden("tidak punya akses untuk menghapus item ini")
	}
	if err := s.repo.SoftDelete(ctx, id, actor.ID); err != nil {
		return apperror.Internal("gagal menghapus item")
	}
	s.writeAudit(ctx, item.ID, item.Name, "deleted", actor.ID)
	return nil
}

// ListDeleted mirrors FolderService.ListDeleted for items.
func (s *ItemService) ListDeleted(ctx context.Context, actor *authctx.AuthUser) ([]model.MenuItem, error) {
	var ownerID *uuid.UUID
	if !actor.IsAdmin() {
		ownerID = &actor.ID
	}
	items, err := s.repo.ListDeleted(ctx, ownerID)
	if err != nil {
		return nil, apperror.Internal("gagal mengambil daftar item terhapus")
	}
	return items, nil
}

// Restore requires CanEditItem on the (soft-deleted) item, and refuses
// if the item's folder is itself still soft-deleted (restore the
// folder first) or if another item has since taken over its URL.
func (s *ItemService) Restore(ctx context.Context, id uuid.UUID, actor *authctx.AuthUser) error {
	item, err := s.repo.FindByIDAny(ctx, id)
	if err != nil {
		return apperror.NotFound("item tidak ditemukan")
	}
	if item.DeletedAt == nil {
		return apperror.BadRequest("item ini tidak dalam status terhapus")
	}
	if !s.perm.CanEditItem(actor, item) {
		return apperror.Forbidden("tidak punya akses untuk memulihkan item ini")
	}
	if item.FolderID != nil {
		if _, err := s.folderRepo.FindByID(ctx, *item.FolderID); err != nil {
			return apperror.Conflict("folder tempat item ini berada masih terhapus — pulihkan folder terlebih dahulu")
		}
	}

	exists, err := s.repo.ExistsByURL(ctx, item.URL)
	if err != nil {
		return apperror.Internal("gagal memvalidasi URL")
	}
	if exists {
		return apperror.Conflict("URL item ini sudah dipakai item lain, tidak bisa dipulihkan")
	}

	if err := s.repo.Restore(ctx, id); err != nil {
		return apperror.Internal("gagal memulihkan item")
	}
	s.writeAudit(ctx, item.ID, item.Name, "restored", actor.ID)
	return nil
}

// List is gated by the target folder's PIN (same reasoning as
// FolderService.ListChildren — listing items inside a protected
// folder reveals its contents).
func (s *ItemService) List(ctx context.Context, f dto.ItemFilter, actor *authctx.AuthUser, unlockToken string) ([]model.MenuItem, int64, error) {
	if f.FolderID != nil {
		folder, err := s.folderRepo.FindByID(ctx, *f.FolderID)
		if err != nil {
			return nil, 0, apperror.NotFound("folder tidak ditemukan")
		}
		unlocked, err := s.perm.IsFolderUnlocked(ctx, actor, folder, unlockToken)
		if err != nil {
			return nil, 0, apperror.Internal("gagal memeriksa akses")
		}
		if !unlocked {
			return nil, 0, apperror.PinRequired(folder.Name)
		}
	}

	if f.Page < 1 {
		f.Page = 1
	}
	if f.Limit < 1 || f.Limit > 100 {
		f.Limit = 20
	}
	items, total, err := s.repo.FindByFilter(ctx, f)
	if err != nil {
		return nil, 0, apperror.Internal("gagal mengambil daftar item")
	}
	return items, total, nil
}

// Search performs the global search and attaches a breadcrumb to each
// result (section 16.7) so the guest knows which folder it lives in.
func (s *ItemService) Search(ctx context.Context, f dto.SearchFilter, folderSvc *FolderService) ([]dto.SearchResultItem, int64, error) {
	if f.Page < 1 {
		f.Page = 1
	}
	if f.Limit < 1 || f.Limit > 100 {
		f.Limit = 20
	}
	items, total, err := s.repo.Search(ctx, f)
	if err != nil {
		return nil, 0, apperror.Internal("gagal melakukan pencarian")
	}

	results := make([]dto.SearchResultItem, 0, len(items))
	for _, item := range items {
		var breadcrumb []model.Folder
		if item.FolderID != nil {
			breadcrumb, _ = folderSvc.BuildBreadcrumb(ctx, *item.FolderID)
		}
		results = append(results, dto.SearchResultItem{MenuItem: item, Breadcrumb: breadcrumb})
	}
	return results, total, nil
}
