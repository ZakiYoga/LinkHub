package service

import (
	"context"

	"github.com/google/uuid"
	"github.com/zaki/linkhub-backend/internal/authctx"
	"github.com/zaki/linkhub-backend/internal/model"
	"github.com/zaki/linkhub-backend/internal/repository"
	"github.com/zaki/linkhub-backend/pkg/apperror"
)

const recentViewLimit = 20

type RecentViewService struct {
	repo       repository.RecentViewRepository
	folderRepo repository.FolderRepository
	itemRepo   repository.ItemRepository
}

func NewRecentViewService(
	repo repository.RecentViewRepository,
	folderRepo repository.FolderRepository,
	itemRepo repository.ItemRepository,
) *RecentViewService {
	return &RecentViewService{repo: repo, folderRepo: folderRepo, itemRepo: itemRepo}
}

// Track is a no-op for guests (actor == nil) — by design, guest
// browsing history never touches the backend, only localStorage on
// their own device.
func (s *RecentViewService) Track(ctx context.Context, actor *authctx.AuthUser, entityType string, entityID uuid.UUID, entityName string) error {
	if actor == nil {
		return nil
	}
	if err := s.repo.Track(ctx, actor.ID, entityType, entityID, entityName); err != nil {
		return apperror.Internal("gagal mencatat aktivitas")
	}
	return nil
}

// List returns the user's recent views, annotating each row with
// EntityDeleted so the frontend can show a "sudah dihapus" badge and
// disable the link, instead of navigating into a 404.
func (s *RecentViewService) List(ctx context.Context, actor *authctx.AuthUser) ([]model.RecentView, error) {
	rows, err := s.repo.ListByUser(ctx, actor.ID, recentViewLimit)
	if err != nil {
		return nil, apperror.Internal("gagal mengambil recent activity")
	}
	if len(rows) == 0 {
		return rows, nil
	}

	var folderIDs, itemIDs []uuid.UUID
	for _, row := range rows {
		switch row.EntityType {
		case "folder":
			folderIDs = append(folderIDs, row.EntityID)
		case "menu_item":
			itemIDs = append(itemIDs, row.EntityID)
		}
	}

	activeFolders, err := s.folderRepo.ExistsActiveIDs(ctx, folderIDs)
	if err != nil {
		return nil, apperror.Internal("gagal memeriksa status folder")
	}
	activeItems, err := s.itemRepo.ExistsActiveIDs(ctx, itemIDs)
	if err != nil {
		return nil, apperror.Internal("gagal memeriksa status item")
	}

	for i := range rows {
		switch rows[i].EntityType {
		case "folder":
			rows[i].EntityDeleted = !activeFolders[rows[i].EntityID]
		case "menu_item":
			rows[i].EntityDeleted = !activeItems[rows[i].EntityID]
		}
	}

	return rows, nil
}
