package repository

import (
	"context"
	"time"

	"github.com/google/uuid"
	"github.com/zaki/linkhub-backend/internal/dto"
	"github.com/zaki/linkhub-backend/internal/model"
	"gorm.io/gorm"
)

// FolderRepository is an interface (not a concrete struct) so that
// FolderService depends on a contract, not on GORM directly. This is
// what lets us swap in a mock implementation for unit tests later
// (section 15.1 of the design doc) — comparable to depending on an
// abstract repository/Protocol in Python instead of the concrete
// SQLAlchemy session.
type FolderRepository interface {
	Create(ctx context.Context, f *model.Folder) error
	FindByID(ctx context.Context, id uuid.UUID) (*model.Folder, error)
	// FindByIDAny is like FindByID but ignores the deleted_at filter —
	// needed for restore (which must find an already-deleted row).
	FindByIDAny(ctx context.Context, id uuid.UUID) (*model.Folder, error)
	FindChildren(ctx context.Context, parentID *uuid.UUID) ([]model.Folder, error)
	Update(ctx context.Context, f *model.Folder) error
	CountDescendants(ctx context.Context, id uuid.UUID) (subfolders int64, items int64, err error)

	// ListDeleted returns soft-deleted folders. If ownerID is non-nil,
	// results are scoped to that owner (staff view); nil lists every
	// deleted folder (admin view) — design doc doesn't specify a trash
	// view, this is a practical addition for the restore feature.
	ListDeleted(ctx context.Context, ownerID *uuid.UUID) ([]model.Folder, error)

	// FindForeignDescendants lists every folder/item in the subtree
	// (including the root folder's direct items, excluding the root
	// folder itself) whose CreatedBy differs from ownerID. Used by the
	// delete guard (design doc section 7).
	FindForeignDescendants(ctx context.Context, rootID uuid.UUID, ownerID uuid.UUID) ([]dto.BlockingEntity, error)

	// SoftDeleteSubtree marks the root folder and everything nested
	// below it (folders + items) as deleted, in one transaction, and is
	// the only way folders get removed now (no hard delete anymore).
	SoftDeleteSubtree(ctx context.Context, rootID uuid.UUID, deletedBy uuid.UUID) error

	// RestoreSubtree is the inverse of SoftDeleteSubtree: un-deletes the
	// root folder and every folder/item nested below it that is
	// currently soft-deleted, in one transaction.
	RestoreSubtree(ctx context.Context, rootID uuid.UUID) error
	ExistsActiveIDs(ctx context.Context, ids []uuid.UUID) (map[uuid.UUID]bool, error)
}

type folderRepository struct {
	db *gorm.DB
}

func NewFolderRepository(db *gorm.DB) FolderRepository {
	return &folderRepository{db: db}
}

func (r *folderRepository) Create(ctx context.Context, f *model.Folder) error {
	return r.db.WithContext(ctx).Create(f).Error
}

func (r *folderRepository) FindByID(ctx context.Context, id uuid.UUID) (*model.Folder, error) {
	var f model.Folder
	if err := r.db.WithContext(ctx).First(&f, "id = ? AND deleted_at IS NULL", id).Error; err != nil {
		return nil, err
	}
	return &f, nil
}

func (r *folderRepository) FindByIDAny(ctx context.Context, id uuid.UUID) (*model.Folder, error) {
	var f model.Folder
	if err := r.db.WithContext(ctx).First(&f, "id = ?", id).Error; err != nil {
		return nil, err
	}
	return &f, nil
}

func (r *folderRepository) ListDeleted(ctx context.Context, ownerID *uuid.UUID) ([]model.Folder, error) {
	var folders []model.Folder
	query := r.db.WithContext(ctx).Where("deleted_at IS NOT NULL").Order("deleted_at DESC")
	if ownerID != nil {
		query = query.Where("created_by = ?", *ownerID)
	}
	if err := query.Find(&folders).Error; err != nil {
		return nil, err
	}
	return folders, nil
}

// FindChildren lists folders at a single level. parentID == nil means
// root level (top of the tree).
func (r *folderRepository) FindChildren(ctx context.Context, parentID *uuid.UUID) ([]model.Folder, error) {
	var folders []model.Folder
	query := r.db.WithContext(ctx).Where("deleted_at IS NULL").Order("name ASC")
	if parentID == nil {
		query = query.Where("parent_id IS NULL")
	} else {
		query = query.Where("parent_id = ?", *parentID)
	}
	if err := query.Find(&folders).Error; err != nil {
		return nil, err
	}
	return folders, nil
}

func (r *folderRepository) Update(ctx context.Context, f *model.Folder) error {
	return r.db.WithContext(ctx).Save(f).Error
}

// CountDescendants uses a recursive CTE (section 16.6) to count every
// non-deleted subfolder and item nested anywhere below id, in one
// round-trip.
func (r *folderRepository) CountDescendants(ctx context.Context, id uuid.UUID) (int64, int64, error) {
	type result struct {
		SubfolderCount int64
		ItemCount      int64
	}
	var res result

	const q = `
		WITH RECURSIVE subtree AS (
			SELECT id FROM folders WHERE id = ? AND deleted_at IS NULL
			UNION ALL
			SELECT f.id FROM folders f JOIN subtree s ON f.parent_id = s.id WHERE f.deleted_at IS NULL
		)
		SELECT
			(SELECT COUNT(*) FROM folders WHERE id IN (SELECT id FROM subtree) AND id <> ?) AS subfolder_count,
			(SELECT COUNT(*) FROM menu_items WHERE folder_id IN (SELECT id FROM subtree) AND deleted_at IS NULL) AS item_count
	`
	if err := r.db.WithContext(ctx).Raw(q, id, id).Scan(&res).Error; err != nil {
		return 0, 0, err
	}
	return res.SubfolderCount, res.ItemCount, nil
}

func (r *folderRepository) FindForeignDescendants(ctx context.Context, rootID uuid.UUID, ownerID uuid.UUID) ([]dto.BlockingEntity, error) {
	const q = `
		WITH RECURSIVE subtree AS (
			SELECT id FROM folders WHERE id = ? AND deleted_at IS NULL
			UNION ALL
			SELECT f.id FROM folders f JOIN subtree s ON f.parent_id = s.id WHERE f.deleted_at IS NULL
		)
		SELECT 'folder' AS type, id, name, created_by
			FROM folders
			WHERE id IN (SELECT id FROM subtree) AND id <> ? AND created_by <> ? AND deleted_at IS NULL
		UNION ALL
		SELECT 'menu_item' AS type, id, name, created_by
			FROM menu_items
			WHERE folder_id IN (SELECT id FROM subtree) AND created_by <> ? AND deleted_at IS NULL
	`
	var rows []dto.BlockingEntity
	if err := r.db.WithContext(ctx).Raw(q, rootID, rootID, ownerID, ownerID).Scan(&rows).Error; err != nil {
		return nil, err
	}
	return rows, nil
}

func (r *folderRepository) SoftDeleteSubtree(ctx context.Context, rootID uuid.UUID, deletedBy uuid.UUID) error {
	now := time.Now()

	return r.db.WithContext(ctx).Transaction(func(tx *gorm.DB) error {
		const subtreeQ = `
			WITH RECURSIVE subtree AS (
				SELECT id FROM folders WHERE id = ? AND deleted_at IS NULL
				UNION ALL
				SELECT f.id FROM folders f JOIN subtree s ON f.parent_id = s.id WHERE f.deleted_at IS NULL
			)
			SELECT id FROM subtree
		`
		// Manual row iteration instead of .Scan(&[]uuid.UUID{}) — GORM's
		// Scan-into-a-scalar-slice behavior for raw queries isn't
		// something to rely on for a destructive operation like this.
		rows, err := tx.Raw(subtreeQ, rootID).Rows()
		if err != nil {
			return err
		}

		var folderIDs []uuid.UUID
		for rows.Next() {
			var id uuid.UUID
			if err := rows.Scan(&id); err != nil {
				rows.Close()
				return err
			}
			folderIDs = append(folderIDs, id)
		}
		rowsErr := rows.Err()
		rows.Close() // must close before issuing more queries on the same tx

		if rowsErr != nil {
			return rowsErr
		}
		if len(folderIDs) == 0 {
			return nil
		}

		if err := tx.Model(&model.MenuItem{}).
			Where("folder_id IN ? AND deleted_at IS NULL", folderIDs).
			Updates(map[string]interface{}{"deleted_at": now, "deleted_by": deletedBy}).Error; err != nil {
			return err
		}

		if err := tx.Model(&model.Folder{}).
			Where("id IN ? AND deleted_at IS NULL", folderIDs).
			Updates(map[string]interface{}{"deleted_at": now, "deleted_by": deletedBy}).Error; err != nil {
			return err
		}

		return nil
	})
}

// RestoreSubtree walks the full subtree (including already-active
// nodes, since it filters by deleted_at IS NOT NULL in the UPDATE, not
// in the tree walk) and clears deleted_at/deleted_by on every folder
// and item that's currently soft-deleted underneath rootID.
func (r *folderRepository) RestoreSubtree(ctx context.Context, rootID uuid.UUID) error {
	return r.db.WithContext(ctx).Transaction(func(tx *gorm.DB) error {
		// Deliberately no "deleted_at IS NULL" filter in the recursive
		// walk itself — unlike SoftDeleteSubtree, we need to traverse
		// through currently-deleted folders to find their (also deleted)
		// children.
		const subtreeQ = `
			WITH RECURSIVE subtree AS (
				SELECT id FROM folders WHERE id = ?
				UNION ALL
				SELECT f.id FROM folders f JOIN subtree s ON f.parent_id = s.id
			)
			SELECT id FROM subtree
		`
		rows, err := tx.Raw(subtreeQ, rootID).Rows()
		if err != nil {
			return err
		}

		var folderIDs []uuid.UUID
		for rows.Next() {
			var id uuid.UUID
			if err := rows.Scan(&id); err != nil {
				rows.Close()
				return err
			}
			folderIDs = append(folderIDs, id)
		}
		rowsErr := rows.Err()
		rows.Close()

		if rowsErr != nil {
			return rowsErr
		}
		if len(folderIDs) == 0 {
			return nil
		}

		if err := tx.Model(&model.Folder{}).
			Where("id IN ? AND deleted_at IS NOT NULL", folderIDs).
			Updates(map[string]interface{}{"deleted_at": nil, "deleted_by": nil}).Error; err != nil {
			return err
		}

		if err := tx.Model(&model.MenuItem{}).
			Where("folder_id IN ? AND deleted_at IS NOT NULL", folderIDs).
			Updates(map[string]interface{}{"deleted_at": nil, "deleted_by": nil}).Error; err != nil {
			return err
		}

		return nil
	})
}

func (r *folderRepository) ExistsActiveIDs(ctx context.Context, ids []uuid.UUID) (map[uuid.UUID]bool, error) {
	result := make(map[uuid.UUID]bool, len(ids))
	if len(ids) == 0 {
		return result, nil
	}
	var found []uuid.UUID
	if err := r.db.WithContext(ctx).Model(&model.Folder{}).
		Where("id IN ? AND deleted_at IS NULL", ids).
		Pluck("id", &found).Error; err != nil {
		return nil, err
	}
	for _, id := range found {
		result[id] = true
	}
	return result, nil
}
