package service

import (
	"context"
	"time"

	"github.com/golang-jwt/jwt/v5"
	"github.com/google/uuid"
	"github.com/zaki/linkhub-backend/internal/authctx"
	"github.com/zaki/linkhub-backend/internal/model"
	"github.com/zaki/linkhub-backend/internal/repository"
)

// PermissionService centralizes the ownership/collaborator/role checks
// described in design doc section 4, so FolderService and ItemService
// don't each reimplement the ancestor-walk. It also owns the PIN-folder
// unlock token (sign + verify), since that's really just another kind
// of access check — not part of the original design doc text (which is
// no longer available to re-check verbatim), designed from the general
// "PIN-protected shared folder" pattern discussed in conversation.
type PermissionService struct {
	folderRepo repository.FolderRepository
	collabRepo repository.FolderCollaboratorRepository
	jwtSecret  string
}

func NewPermissionService(folderRepo repository.FolderRepository, collabRepo repository.FolderCollaboratorRepository, jwtSecret string) *PermissionService {
	return &PermissionService{folderRepo: folderRepo, collabRepo: collabRepo, jwtSecret: jwtSecret}
}

// CanAccessFolder answers "may this user create/act inside this
// folder" — true for admin, the folder's owner, or a collaborator on
// this folder OR any of its ancestors (inherited access, section 5).
func (p *PermissionService) CanAccessFolder(ctx context.Context, user *authctx.AuthUser, folder *model.Folder) (bool, error) {
	if user == nil {
		return false, nil
	}
	if user.IsAdmin() {
		return true, nil
	}
	if folder.CreatedBy == user.ID {
		return true, nil
	}

	chain, err := p.ancestorChainIDs(ctx, folder)
	if err != nil {
		return false, err
	}
	return p.collabRepo.IsCollaboratorOfAny(ctx, chain, user.ID)
}

// CanEditFolder answers "may this user rename/move/delete this folder
// as its own content" — admin or the folder's own creator only.
// Collaborator status alone does not grant edit rights (section 4).
func (p *PermissionService) CanEditFolder(user *authctx.AuthUser, folder *model.Folder) bool {
	if user == nil {
		return false
	}
	return user.IsAdmin() || folder.CreatedBy == user.ID
}

// CanEditItem mirrors CanEditFolder for items.
func (p *PermissionService) CanEditItem(user *authctx.AuthUser, item *model.MenuItem) bool {
	if user == nil {
		return false
	}
	return user.IsAdmin() || item.CreatedBy == user.ID
}

// CanManageCollaborators answers "may this user add/remove
// collaborators on this folder" — owner or admin only (section 5).
func (p *PermissionService) CanManageCollaborators(user *authctx.AuthUser, folder *model.Folder) bool {
	return p.CanEditFolder(user, folder)
}

// CanManagePin mirrors CanEditFolder — owner or admin may set/change/
// remove a folder's PIN.
func (p *PermissionService) CanManagePin(user *authctx.AuthUser, folder *model.Folder) bool {
	return p.CanEditFolder(user, folder)
}

// ancestorChainIDs walks from folder up to the root, collecting every
// folder ID along the way (including folder itself). This reuses the
// same walk-up-parent pattern as FolderService.BuildBreadcrumb.
func (p *PermissionService) ancestorChainIDs(ctx context.Context, folder *model.Folder) ([]uuid.UUID, error) {
	ids := []uuid.UUID{folder.ID}
	currentParentID := folder.ParentID

	for currentParentID != nil {
		parent, err := p.folderRepo.FindByID(ctx, *currentParentID)
		if err != nil {
			// Parent missing/soft-deleted: stop walking rather than fail
			// the whole permission check.
			break
		}
		ids = append(ids, parent.ID)
		currentParentID = parent.ParentID
	}
	return ids, nil
}

// --- PIN-folder unlock tokens ---
//
// PIN protection is per-folder, NOT inherited to subfolders (simpler
// than the collaborator-inheritance model — a deliberate simplification
// flagged since the original spec text isn't available to verify
// against). A correct PIN gets you a signed, short-lived token scoped
// to exactly that folder ID; the frontend attaches it on subsequent
// browse requests into that folder via the X-Folder-Pin-Token header.

type PinClaims struct {
	FolderID string `json:"folder_id"`
	Purpose  string `json:"purpose"`
	jwt.RegisteredClaims
}

const pinUnlockPurpose = "folder_unlock"
const pinUnlockTTL = 4 * time.Hour

func (p *PermissionService) SignFolderUnlockToken(folderID uuid.UUID) (string, error) {
	claims := PinClaims{
		FolderID: folderID.String(),
		Purpose:  pinUnlockPurpose,
		RegisteredClaims: jwt.RegisteredClaims{
			ExpiresAt: jwt.NewNumericDate(time.Now().Add(pinUnlockTTL)),
			IssuedAt:  jwt.NewNumericDate(time.Now()),
		},
	}
	token := jwt.NewWithClaims(jwt.SigningMethodHS256, claims)
	return token.SignedString([]byte(p.jwtSecret))
}

func (p *PermissionService) verifyFolderUnlockToken(tokenStr string, folderID uuid.UUID) bool {
	if tokenStr == "" {
		return false
	}
	claims := &PinClaims{}
	token, err := jwt.ParseWithClaims(tokenStr, claims, func(t *jwt.Token) (interface{}, error) {
		return []byte(p.jwtSecret), nil
	})
	if err != nil || !token.Valid {
		return false
	}
	return claims.Purpose == pinUnlockPurpose && claims.FolderID == folderID.String()
}

func (p *PermissionService) IsFolderUnlocked(ctx context.Context, user *authctx.AuthUser, folder *model.Folder, unlockToken string) (bool, error) {
	if folder.PinHash == nil {
		return true, nil
	}
	if user != nil {
		canAccess, err := p.CanAccessFolder(ctx, user, folder)
		if err != nil {
			return false, err
		}
		if canAccess {
			return true, nil // owner/collaborator/admin bypass PIN sepenuhnya
		}
	}
	return p.verifyFolderUnlockToken(unlockToken, folder.ID), nil
}
