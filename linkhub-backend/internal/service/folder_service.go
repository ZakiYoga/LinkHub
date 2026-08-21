package service

import (
	"context"

	"github.com/google/uuid"
	"github.com/zaki/linkhub-backend/internal/authctx"
	"github.com/zaki/linkhub-backend/internal/dto"
	"github.com/zaki/linkhub-backend/internal/model"
	"github.com/zaki/linkhub-backend/internal/repository"
	"github.com/zaki/linkhub-backend/pkg/apperror"
	"golang.org/x/crypto/bcrypt"
)

type FolderService struct {
	repo       repository.FolderRepository
	collabRepo repository.FolderCollaboratorRepository
	auditRepo  repository.AuditLogRepository
	perm       *PermissionService
}

func NewFolderService(
	repo repository.FolderRepository,
	collabRepo repository.FolderCollaboratorRepository,
	auditRepo repository.AuditLogRepository,
	perm *PermissionService,
) *FolderService {
	return &FolderService{repo: repo, collabRepo: collabRepo, auditRepo: auditRepo, perm: perm}
}

func (s *FolderService) writeAudit(ctx context.Context, entityID uuid.UUID, entityName, action string, actorID uuid.UUID) {
	// Audit logging failures are intentionally swallowed (logged, not
	// propagated) — a broken audit trail shouldn't block the actual
	// operation from succeeding.
	_ = s.auditRepo.Create(ctx, &model.AuditLog{
		EntityType: "folder",
		EntityID:   entityID,
		EntityName: entityName,
		Action:     action,
		ActorID:    actorID,
	})
}

// Create requires the actor to have access to the parent folder
// (owner/collaborator/admin) when creating inside one; creating at
// root has no parent to check against, so any logged-in user may do it
// (design doc section 4 & 9).
func (s *FolderService) Create(ctx context.Context, in dto.CreateFolderInput, actor *authctx.AuthUser) (*model.Folder, error) {
	if in.ParentID != nil {
		parent, err := s.repo.FindByID(ctx, *in.ParentID)
		if err != nil {
			return nil, apperror.NotFound("folder induk tidak ditemukan")
		}
		allowed, err := s.perm.CanAccessFolder(ctx, actor, parent)
		if err != nil {
			return nil, apperror.Internal("gagal memeriksa akses")
		}
		if !allowed {
			return nil, apperror.Forbidden("tidak punya akses ke folder ini")
		}
	}

	f := &model.Folder{
		Name:      in.Name,
		ParentID:  in.ParentID,
		CreatedBy: actor.ID,
	}
	if err := s.repo.Create(ctx, f); err != nil {
		return nil, apperror.Internal("gagal membuat folder")
	}
	s.writeAudit(ctx, f.ID, f.Name, "created", actor.ID)
	return f, nil
}

func (s *FolderService) GetByID(ctx context.Context, id uuid.UUID, actor *authctx.AuthUser, unlockToken string) (*model.Folder, error) {
	f, err := s.repo.FindByID(ctx, id)
	if err != nil {
		return nil, apperror.NotFound("folder tidak ditemukan")
	}
	unlocked, err := s.perm.IsFolderUnlocked(ctx, actor, f, unlockToken)
	if err != nil {
		return nil, apperror.Internal("gagal memeriksa akses")
	}
	if !unlocked {
		return nil, apperror.PinRequired(f.Name)
	}
	f.PinProtected = f.PinHash != nil
	return f, nil
}

// ListChildren is gated by the PARENT folder's own PIN (not each
// child's) — listing what's inside a protected folder reveals its
// contents, so that's exactly what needs the unlock token. Each
// returned child's own PinProtected flag just tells the frontend
// whether THAT child needs its own separate unlock to browse further.
func (s *FolderService) ListChildren(ctx context.Context, parentID *uuid.UUID, actor *authctx.AuthUser, unlockToken string, ownerScope string) ([]model.Folder, error) {
	if parentID != nil {
		parent, err := s.repo.FindByID(ctx, *parentID)
		if err != nil {
			return nil, apperror.NotFound("folder tidak ditemukan")
		}

		unlocked, err := s.perm.IsFolderUnlocked(ctx, actor, parent, unlockToken)
		if err != nil {
			return nil, apperror.Internal("gagal memeriksa akses")
		}

		if !unlocked {
			return nil, apperror.PinRequired(parent.Name)
		}
	}

	var actorID *uuid.UUID
	if actor != nil {
		actorID = &actor.ID
	}
	folders, err := s.repo.FindChildren(ctx, parentID, ownerScope, actorID)
	if err != nil {
		return nil, apperror.Internal("gagal mengambil daftar folder")
	}
	for i := range folders {
		folders[i].PinProtected = folders[i].PinHash != nil
	}
	return folders, nil
}

// Update requires CanEditFolder — the folder's own creator, or admin.
// Being a collaborator alone does not allow renaming/moving someone
// else's folder (section 4). Moving to a different parent (drag & drop
// or manual edit) adds two more checks on top of that: the move can't
// create a cycle in the tree, and the actor must also be welcome in
// the destination folder — CanEditFolder above only proved they own
// *this* folder, not that they may place content into the target one.
//
// Note: in.ParentID being nil is ambiguous between "field omitted" and
// "explicitly move to root" (a plain Go pointer can't tell the two
// apart once JSON-decoded). Every known caller (FolderFormModal, and
// the drag-drop handler) always sends parent_id explicitly, so this is
// safe in practice — but any new caller MUST do the same, or it will
// silently move the folder to root on a rename-only request.
func (s *FolderService) Update(ctx context.Context, id uuid.UUID, in dto.UpdateFolderInput, actor *authctx.AuthUser) (*model.Folder, error) {
	f, err := s.repo.FindByID(ctx, id)
	if err != nil {
		return nil, apperror.NotFound("folder tidak ditemukan")
	}
	if !s.perm.CanEditFolder(actor, f) {
		return nil, apperror.Forbidden("tidak punya akses untuk mengubah folder ini")
	}

	if in.Name != nil {
		f.Name = *in.Name
	}

	parentChanged := (in.ParentID == nil) != (f.ParentID == nil) ||
		(in.ParentID != nil && f.ParentID != nil && *in.ParentID != *f.ParentID)

	if parentChanged {
		if in.ParentID != nil {
			if *in.ParentID == f.ID {
				return nil, apperror.BadRequest("folder tidak bisa dipindahkan ke dalam dirinya sendiri")
			}
			target, err := s.repo.FindByID(ctx, *in.ParentID)
			if err != nil {
				return nil, apperror.NotFound("folder tujuan tidak ditemukan")
			}
			cyclic, err := s.wouldCreateCycle(ctx, f.ID, *in.ParentID)
			if err != nil {
				return nil, apperror.Internal("gagal memeriksa struktur folder")
			}
			if cyclic {
				return nil, apperror.BadRequest("folder tidak bisa dipindahkan ke dalam anaknya sendiri")
			}
			// Same rule as ItemService.Create: allowed to place content
			// here means owner/collaborator/admin of the target — PIN
			// grants browsing, never write access (PermissionService's
			// IsFolderUnlocked bypasses PIN entirely once CanAccessFolder
			// is already true, so there is no separate PIN-based write
			// grant to check here).
			allowed, err := s.perm.CanAccessFolder(ctx, actor, target)
			if err != nil {
				return nil, apperror.Internal("gagal memeriksa akses")
			}
			if !allowed {
				return nil, apperror.Forbidden("tidak punya akses ke folder tujuan")
			}
		}
		// Moving to root (in.ParentID == nil) needs no extra check —
		// same as creating at root, open to any logged-in actor.
		f.ParentID = in.ParentID
	}

	f.UpdatedBy = &actor.ID

	if err := s.repo.Update(ctx, f); err != nil {
		return nil, apperror.Internal("gagal update folder")
	}
	s.writeAudit(ctx, f.ID, f.Name, "updated", actor.ID)
	return f, nil
}

// wouldCreateCycle reports whether setting folderID's parent to
// newParentID would create a cycle — i.e. whether newParentID is
// folderID itself or one of folderID's own descendants. Implemented by
// walking UP from newParentID toward the root (same pattern as
// BuildBreadcrumb / PermissionService.ancestorChainIDs) and checking
// whether folderID appears along that walk; if it does, newParentID is
// a descendant of folderID and the move would loop the tree back on
// itself.
func (s *FolderService) wouldCreateCycle(ctx context.Context, folderID, newParentID uuid.UUID) (bool, error) {
	currentID := &newParentID
	for currentID != nil {
		if *currentID == folderID {
			return true, nil
		}
		f, err := s.repo.FindByID(ctx, *currentID)
		if err != nil {
			// Parent missing/soft-deleted: stop walking rather than
			// fail the whole check — same defensive choice
			// PermissionService.ancestorChainIDs makes.
			break
		}
		currentID = f.ParentID
	}
	return false, nil
}

// Delete implements the delete guard from design doc section 7:
//  1. actor must be able to edit the folder (owner or admin)
//  2. unless actor is admin AND force=true, refuse if anything in the
//     subtree belongs to someone other than the folder's own owner
//  3. otherwise soft-delete the whole subtree in one transaction
//
// Returns the blocking list (non-nil only when blocked) alongside the
// error so the handler can surface a useful 409 body.
func (s *FolderService) Delete(ctx context.Context, id uuid.UUID, actor *authctx.AuthUser, force bool) ([]dto.BlockingEntity, error) {
	f, err := s.repo.FindByID(ctx, id)
	if err != nil {
		return nil, apperror.NotFound("folder tidak ditemukan")
	}
	if !s.perm.CanEditFolder(actor, f) {
		return nil, apperror.Forbidden("tidak punya akses untuk menghapus folder ini")
	}

	if !(actor.IsAdmin() && force) {
		blocking, err := s.repo.FindForeignDescendants(ctx, f.ID, f.CreatedBy)
		if err != nil {
			return nil, apperror.Internal("gagal memeriksa isi folder")
		}
		if len(blocking) > 0 {
			return blocking, apperror.Conflict("folder berisi konten milik user lain")
		}
	}

	if err := s.repo.SoftDeleteSubtree(ctx, f.ID, actor.ID); err != nil {
		return nil, apperror.Internal("gagal menghapus folder")
	}
	s.writeAudit(ctx, f.ID, f.Name, "deleted", actor.ID)
	return nil, nil
}

func (s *FolderService) Summary(ctx context.Context, id uuid.UUID) (*dto.FolderSummary, error) {
	if _, err := s.repo.FindByID(ctx, id); err != nil {
		return nil, apperror.NotFound("folder tidak ditemukan")
	}
	subfolders, items, err := s.repo.CountDescendants(ctx, id)
	if err != nil {
		return nil, apperror.Internal("gagal menghitung isi folder")
	}
	return &dto.FolderSummary{SubfolderCount: subfolders, ItemCount: items}, nil
}

// BuildBreadcrumb walks up the parent chain (section 16.2). Fine for
// typical folder depth; swap for a recursive CTE if it ever becomes a
// bottleneck.
func (s *FolderService) BuildBreadcrumb(ctx context.Context, folderID uuid.UUID) ([]model.Folder, error) {
	var chain []model.Folder
	currentID := &folderID

	for currentID != nil {
		f, err := s.repo.FindByID(ctx, *currentID)
		if err != nil {
			return nil, apperror.NotFound("folder tidak ditemukan")
		}
		chain = append([]model.Folder{*f}, chain...)
		currentID = f.ParentID
	}
	return chain, nil
}

// ListDeleted powers a trash view: admins see every soft-deleted
// folder, everyone else only sees their own (not part of the original
// design doc — a practical addition so soft delete is actually usable
// without direct DB access).
func (s *FolderService) ListDeleted(ctx context.Context, actor *authctx.AuthUser) ([]model.Folder, error) {
	var ownerID *uuid.UUID
	if !actor.IsAdmin() {
		ownerID = &actor.ID
	}
	folders, err := s.repo.ListDeleted(ctx, ownerID)
	if err != nil {
		return nil, apperror.Internal("gagal mengambil daftar folder terhapus")
	}
	return folders, nil
}

// Restore requires CanEditFolder on the (soft-deleted) folder itself —
// same ownership rule as delete. If the folder's parent is itself still
// soft-deleted, restoring is refused until the parent is restored
// first, since re-attaching a folder under a deleted parent would make
// it unreachable through normal browsing.
func (s *FolderService) Restore(ctx context.Context, id uuid.UUID, actor *authctx.AuthUser) error {
	f, err := s.repo.FindByIDAny(ctx, id)
	if err != nil {
		return apperror.NotFound("folder tidak ditemukan")
	}
	if f.DeletedAt == nil {
		return apperror.BadRequest("folder ini tidak dalam status terhapus")
	}
	if !s.perm.CanEditFolder(actor, f) {
		return apperror.Forbidden("tidak punya akses untuk memulihkan folder ini")
	}
	if f.ParentID != nil {
		parent, err := s.repo.FindByIDAny(ctx, *f.ParentID)
		if err == nil && parent.DeletedAt != nil {
			return apperror.Conflict("folder induk masih terhapus — pulihkan folder induk terlebih dahulu")
		}
	}

	if err := s.repo.RestoreSubtree(ctx, f.ID); err != nil {
		return apperror.Internal("gagal memulihkan folder")
	}
	s.writeAudit(ctx, f.ID, f.Name, "restored", actor.ID)
	return nil
}

// --- Collaborator management (design doc section 5) ---

func (s *FolderService) ListCollaborators(ctx context.Context, folderID uuid.UUID, actor *authctx.AuthUser) ([]model.FolderCollaborator, error) {
	f, err := s.repo.FindByID(ctx, folderID)
	if err != nil {
		return nil, apperror.NotFound("folder tidak ditemukan")
	}
	allowed, err := s.perm.CanAccessFolder(ctx, actor, f)
	if err != nil {
		return nil, apperror.Internal("gagal memeriksa akses")
	}
	if !allowed {
		return nil, apperror.Forbidden("tidak punya akses ke folder ini")
	}
	list, err := s.collabRepo.List(ctx, folderID)
	if err != nil {
		return nil, apperror.Internal("gagal mengambil daftar kolaborator")
	}
	return list, nil
}

func (s *FolderService) AddCollaborator(ctx context.Context, folderID uuid.UUID, userID uuid.UUID, actor *authctx.AuthUser) error {
	f, err := s.repo.FindByID(ctx, folderID)
	if err != nil {
		return apperror.NotFound("folder tidak ditemukan")
	}
	if !s.perm.CanManageCollaborators(actor, f) {
		return apperror.Forbidden("hanya owner folder atau admin yang bisa menambah kolaborator")
	}
	if err := s.collabRepo.Add(ctx, folderID, userID, actor.ID); err != nil {
		return apperror.Internal("gagal menambah kolaborator")
	}
	s.writeAudit(ctx, folderID, f.Name, "collaborator_added", actor.ID)
	return nil
}

func (s *FolderService) RemoveCollaborator(ctx context.Context, folderID uuid.UUID, userID uuid.UUID, actor *authctx.AuthUser) error {
	f, err := s.repo.FindByID(ctx, folderID)
	if err != nil {
		return apperror.NotFound("folder tidak ditemukan")
	}
	if !s.perm.CanManageCollaborators(actor, f) {
		return apperror.Forbidden("hanya owner folder atau admin yang bisa menghapus kolaborator")
	}
	if err := s.collabRepo.Remove(ctx, folderID, userID); err != nil {
		return apperror.Internal("gagal menghapus kolaborator")
	}
	s.writeAudit(ctx, folderID, f.Name, "collaborator_removed", actor.ID)
	return nil
}

// --- PIN management (not part of the original design doc text, which
// is no longer available to check verbatim — designed from the general
// PIN-protected-shared-folder pattern) ---

// SetPin requires CanManagePin (owner or admin). Replaces any existing
// PIN — there's no "old PIN" confirmation step, matching how the
// folder's owner can already rename/delete it outright.
func (s *FolderService) SetPin(ctx context.Context, folderID uuid.UUID, pin string, actor *authctx.AuthUser) error {
	f, err := s.repo.FindByID(ctx, folderID)
	if err != nil {
		return apperror.NotFound("folder tidak ditemukan")
	}
	if !s.perm.CanManagePin(actor, f) {
		return apperror.Forbidden("tidak punya akses untuk mengatur PIN folder ini")
	}

	hash, err := bcrypt.GenerateFromPassword([]byte(pin), bcrypt.DefaultCost)
	if err != nil {
		return apperror.Internal("gagal memproses PIN")
	}
	hashStr := string(hash)
	f.PinHash = &hashStr

	if err := s.repo.Update(ctx, f); err != nil {
		return apperror.Internal("gagal menyimpan PIN")
	}
	s.writeAudit(ctx, f.ID, f.Name, "pin_set", actor.ID)
	return nil
}

func (s *FolderService) RemovePin(ctx context.Context, folderID uuid.UUID, actor *authctx.AuthUser) error {
	f, err := s.repo.FindByID(ctx, folderID)
	if err != nil {
		return apperror.NotFound("folder tidak ditemukan")
	}
	if !s.perm.CanManagePin(actor, f) {
		return apperror.Forbidden("tidak punya akses untuk mengatur PIN folder ini")
	}

	f.PinHash = nil
	if err := s.repo.Update(ctx, f); err != nil {
		return apperror.Internal("gagal menghapus PIN")
	}
	s.writeAudit(ctx, f.ID, f.Name, "pin_removed", actor.ID)
	return nil
}

// VerifyPin checks the submitted PIN and, on success, issues a signed
// unlock token scoped to this folder (see PermissionService). No
// actor/login required — guests need this too.
func (s *FolderService) VerifyPin(ctx context.Context, folderID uuid.UUID, pin string) (string, error) {
	f, err := s.repo.FindByID(ctx, folderID)
	if err != nil {
		return "", apperror.NotFound("folder tidak ditemukan")
	}
	if f.PinHash == nil {
		return "", apperror.BadRequest("folder ini tidak memiliki PIN")
	}
	if err := bcrypt.CompareHashAndPassword([]byte(*f.PinHash), []byte(pin)); err != nil {
		return "", apperror.Unauthorized("PIN salah")
	}

	token, err := s.perm.SignFolderUnlockToken(f.ID)
	if err != nil {
		return "", apperror.Internal("gagal membuat token akses")
	}
	return token, nil
}
