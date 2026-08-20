package repository

import (
	"context"
	"time"

	"github.com/google/uuid"
	"github.com/zaki/linkhub-backend/internal/dto"
	"github.com/zaki/linkhub-backend/internal/model"
	"gorm.io/gorm"
)

type ItemRepository interface {
	Create(ctx context.Context, item *model.MenuItem) error
	FindByID(ctx context.Context, id uuid.UUID) (*model.MenuItem, error)
	// FindByIDAny is like FindByID but ignores the deleted_at filter —
	// needed for restore.
	FindByIDAny(ctx context.Context, id uuid.UUID) (*model.MenuItem, error)
	Update(ctx context.Context, item *model.MenuItem) error
	SoftDelete(ctx context.Context, id uuid.UUID, deletedBy uuid.UUID) error
	Restore(ctx context.Context, id uuid.UUID) error
	ExistsByURL(ctx context.Context, url string) (bool, error)
	FindByFilter(ctx context.Context, f dto.ItemFilter) ([]model.MenuItem, int64, error)
	Search(ctx context.Context, f dto.SearchFilter) ([]model.MenuItem, int64, error)
	SetTags(ctx context.Context, item *model.MenuItem, tagIDs []uuid.UUID) error
	// ListDeleted returns soft-deleted items, scoped to ownerID when
	// non-nil (staff view) or every deleted item when nil (admin view).
	ListDeleted(ctx context.Context, ownerID *uuid.UUID) ([]model.MenuItem, error)
	ExistsActiveIDs(ctx context.Context, ids []uuid.UUID) (map[uuid.UUID]bool, error)
}

type itemRepository struct {
	db *gorm.DB
}

func NewItemRepository(db *gorm.DB) ItemRepository {
	return &itemRepository{db: db}
}

func (r *itemRepository) Create(ctx context.Context, item *model.MenuItem) error {
	return r.db.WithContext(ctx).Create(item).Error
}

func (r *itemRepository) FindByID(ctx context.Context, id uuid.UUID) (*model.MenuItem, error) {
	var item model.MenuItem
	if err := r.db.WithContext(ctx).Preload("Tags").First(&item, "id = ? AND deleted_at IS NULL", id).Error; err != nil {
		return nil, err
	}
	return &item, nil
}

func (r *itemRepository) FindByIDAny(ctx context.Context, id uuid.UUID) (*model.MenuItem, error) {
	var item model.MenuItem
	if err := r.db.WithContext(ctx).Preload("Tags").First(&item, "id = ?", id).Error; err != nil {
		return nil, err
	}
	return &item, nil
}

func (r *itemRepository) Update(ctx context.Context, item *model.MenuItem) error {
	return r.db.WithContext(ctx).Save(item).Error
}

// SoftDelete replaces the old hard Delete — items are never actually
// removed anymore, only flagged (design doc section 6). This also lets
// the URL be reused once deleted, thanks to the partial unique index
// created in migration 000010.
func (r *itemRepository) SoftDelete(ctx context.Context, id uuid.UUID, deletedBy uuid.UUID) error {
	now := time.Now()
	return r.db.WithContext(ctx).Model(&model.MenuItem{}).
		Where("id = ? AND deleted_at IS NULL", id).
		Updates(map[string]interface{}{"deleted_at": now, "deleted_by": deletedBy}).Error
}

// Restore clears deleted_at/deleted_by on a single item. Unlike
// folders, items don't nest, so there's no subtree to walk.
func (r *itemRepository) Restore(ctx context.Context, id uuid.UUID) error {
	return r.db.WithContext(ctx).Model(&model.MenuItem{}).
		Where("id = ? AND deleted_at IS NOT NULL", id).
		Updates(map[string]interface{}{"deleted_at": nil, "deleted_by": nil}).Error
}

func (r *itemRepository) ListDeleted(ctx context.Context, ownerID *uuid.UUID) ([]model.MenuItem, error) {
	var items []model.MenuItem
	query := r.db.WithContext(ctx).Preload("Tags").Where("deleted_at IS NOT NULL").Order("deleted_at DESC")
	if ownerID != nil {
		query = query.Where("created_by = ?", *ownerID)
	}
	if err := query.Find(&items).Error; err != nil {
		return nil, err
	}
	return items, nil
}

func (r *itemRepository) ExistsByURL(ctx context.Context, url string) (bool, error) {
	var count int64
	err := r.db.WithContext(ctx).Model(&model.MenuItem{}).
		Where("url = ? AND deleted_at IS NULL", url).Count(&count).Error
	return count > 0, err
}

// SetTags replaces an item's tag associations (used by both create and
// update flows). GORM's Association Replace handles the join-table
// rows for us, so we don't touch menu_item_tags manually.
func (r *itemRepository) SetTags(ctx context.Context, item *model.MenuItem, tagIDs []uuid.UUID) error {
	if len(tagIDs) == 0 {
		return r.db.WithContext(ctx).Model(item).Association("Tags").Clear()
	}
	var tags []model.Tag
	if err := r.db.WithContext(ctx).Where("id IN ?", tagIDs).Find(&tags).Error; err != nil {
		return err
	}
	return r.db.WithContext(ctx).Model(item).Association("Tags").Replace(tags)
}

// FindByFilter powers "browse mode": items inside a single folder,
// filtered by type/tag and paginated (design doc section 15.4).
func (r *itemRepository) FindByFilter(ctx context.Context, f dto.ItemFilter) ([]model.MenuItem, int64, error) {
	query := r.db.WithContext(ctx).Model(&model.MenuItem{}).Where("deleted_at IS NULL")

	if f.FolderID == nil {
		query = query.Where("folder_id IS NULL")
	} else {
		query = query.Where("folder_id = ?", *f.FolderID)
	}
	if f.Type != "" {
		query = query.Where("menu_items.type = ?", f.Type)
	}
	if len(f.TagIDs) > 0 {
		query = query.Joins("JOIN menu_item_tags mit ON mit.menu_item_id = menu_items.id").
			Where("mit.tag_id IN ?", f.TagIDs).
			Group("menu_items.id")
	}
	query = applyOwnerScope(query, f.OwnerScope, f.ActorID, "created_by", "folder_id")
	if f.Sort == "newest" {
		query = query.Order("created_at DESC")
	} else {
		query = query.Order("name ASC")
	}

	var total int64
	if err := query.Count(&total).Error; err != nil {
		return nil, 0, err
	}

	var items []model.MenuItem
	err := query.Preload("Tags").
		Offset((f.Page - 1) * f.Limit).
		Limit(f.Limit).
		Find(&items).Error

	return items, total, err
}

// Search powers "search mode": global search across every folder
// (design doc section 16.7). It doesn't care about hierarchy at all —
// menu_items is a flat table.
func (r *itemRepository) Search(ctx context.Context, f dto.SearchFilter) ([]model.MenuItem, int64, error) {
	query := r.db.WithContext(ctx).Model(&model.MenuItem{}).
		Joins("LEFT JOIN folders search_pf ON search_pf.id = menu_items.folder_id").
		Where("menu_items.deleted_at IS NULL").
		// Items inside a PIN-protected folder never surface in global
		// search — search has no concept of "unlock this one folder",
		// so the safe default is to exclude them entirely rather than
		// leak protected content through a side channel.
		Where("menu_items.folder_id IS NULL OR search_pf.pin_hash IS NULL")

	if f.Query != "" {
		query = query.Where("menu_items.name ILIKE ?", "%"+f.Query+"%")
	}
	if f.Type != "" {
		query = query.Where("menu_items.type = ?", f.Type)
	}
	if len(f.TagIDs) > 0 {
		query = query.Joins("JOIN menu_item_tags mit ON mit.menu_item_id = menu_items.id").
			Where("mit.tag_id IN ?", f.TagIDs).
			Group("menu_items.id")
	}
	query = applyOwnerScope(query, f.OwnerScope, f.ActorID, "menu_items.created_by", "menu_items.folder_id")

	var total int64
	if err := query.Count(&total).Error; err != nil {
		return nil, 0, err
	}

	var items []model.MenuItem
	err := query.Preload("Tags").
		Offset((f.Page - 1) * f.Limit).
		Limit(f.Limit).
		Find(&items).Error

	return items, total, err
}

func (r *itemRepository) ExistsActiveIDs(ctx context.Context, ids []uuid.UUID) (map[uuid.UUID]bool, error) {
	result := make(map[uuid.UUID]bool, len(ids))
	if len(ids) == 0 {
		return result, nil
	}
	var found []uuid.UUID
	if err := r.db.WithContext(ctx).Model(&model.MenuItem{}).
		Where("id IN ? AND deleted_at IS NULL", ids).
		Pluck("id", &found).Error; err != nil {
		return nil, err
	}
	for _, id := range found {
		result[id] = true
	}
	return result, nil
}
