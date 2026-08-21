package service

import (
	"context"
	"testing"

	"github.com/google/uuid"
	"github.com/zaki/linkhub-backend/internal/dto"
	"github.com/zaki/linkhub-backend/internal/model"
)

// fakeFolderRepo is a minimal in-memory FolderRepository used only to
// exercise wouldCreateCycle — every other method panics if called,
// which doubles as an assertion that the function under test doesn't
// reach outside FindByID.
type fakeFolderRepo struct {
	byID map[uuid.UUID]*model.Folder
}

func newFakeFolderRepo() *fakeFolderRepo {
	return &fakeFolderRepo{byID: map[uuid.UUID]*model.Folder{}}
}

// add registers a folder with the given id and parent (nil = root) so
// tests can build a tree with plain uuid.New() calls.
func (r *fakeFolderRepo) add(id uuid.UUID, parent *uuid.UUID) {
	r.byID[id] = &model.Folder{ID: id, ParentID: parent}
}

func (r *fakeFolderRepo) FindByID(_ context.Context, id uuid.UUID) (*model.Folder, error) {
	f, ok := r.byID[id]
	if !ok {
		return nil, errNotFound
	}
	return f, nil
}

func (r *fakeFolderRepo) Create(context.Context, *model.Folder) error { panic("not used") }
func (r *fakeFolderRepo) FindByIDAny(context.Context, uuid.UUID) (*model.Folder, error) {
	panic("not used")
}
func (r *fakeFolderRepo) FindChildren(context.Context, *uuid.UUID, string, *uuid.UUID) ([]model.Folder, error) {
	panic("not used")
}
func (r *fakeFolderRepo) Update(context.Context, *model.Folder) error { panic("not used") }
func (r *fakeFolderRepo) CountDescendants(context.Context, uuid.UUID) (int64, int64, error) {
	panic("not used")
}
func (r *fakeFolderRepo) ListDeleted(context.Context, *uuid.UUID) ([]model.Folder, error) {
	panic("not used")
}
func (r *fakeFolderRepo) FindForeignDescendants(context.Context, uuid.UUID, uuid.UUID) ([]dto.BlockingEntity, error) {
	panic("not used")
}
func (r *fakeFolderRepo) SoftDeleteSubtree(context.Context, uuid.UUID, uuid.UUID) error {
	panic("not used")
}
func (r *fakeFolderRepo) RestoreSubtree(context.Context, uuid.UUID) error { panic("not used") }
func (r *fakeFolderRepo) ExistsActiveIDs(context.Context, []uuid.UUID) (map[uuid.UUID]bool, error) {
	panic("not used")
}

var errNotFound = &notFoundErr{}

type notFoundErr struct{}

func (*notFoundErr) Error() string { return "not found" }

func TestWouldCreateCycle(t *testing.T) {
	// Tree used by every case below:
	//   root
	//   └── a
	//       └── b
	//           └── c
	//   unrelated
	root := uuid.New()
	a := uuid.New()
	b := uuid.New()
	c := uuid.New()
	unrelated := uuid.New()

	repo := newFakeFolderRepo()
	repo.add(root, nil)
	repo.add(a, &root)
	repo.add(b, &a)
	repo.add(c, &b)
	repo.add(unrelated, nil)

	svc := &FolderService{repo: repo}

	tests := []struct {
		name        string
		folderID    uuid.UUID
		newParentID uuid.UUID
		wantCycle   bool
	}{
		{
			name:        "move into direct child is a cycle",
			folderID:    a,
			newParentID: b,
			wantCycle:   true,
		},
		{
			name:        "move into grandchild is a cycle",
			folderID:    a,
			newParentID: c,
			wantCycle:   true,
		},
		{
			name:        "move into an unrelated folder is fine",
			folderID:    a,
			newParentID: unrelated,
			wantCycle:   false,
		},
		{
			name:        "move a leaf folder anywhere is fine (no descendants to loop into)",
			folderID:    c,
			newParentID: unrelated,
			wantCycle:   false,
		},
		{
			name:        "move into current parent's sibling is fine",
			folderID:    b,
			newParentID: root,
			wantCycle:   false,
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			got, err := svc.wouldCreateCycle(context.Background(), tt.folderID, tt.newParentID)
			if err != nil {
				t.Fatalf("unexpected error: %v", err)
			}
			if got != tt.wantCycle {
				t.Errorf("wouldCreateCycle(%s -> %s) = %v, want %v", tt.folderID, tt.newParentID, got, tt.wantCycle)
			}
		})
	}
}
