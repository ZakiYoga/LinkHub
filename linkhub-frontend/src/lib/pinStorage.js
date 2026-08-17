// Unlock tokens live in sessionStorage (not localStorage) — deliberately
// scoped to the current tab session, not "remembered forever" on this
// device. Keyed per folder ID since each protected folder needs its
// own separate unlock (PIN is per-folder, not inherited — see backend
// PermissionService).
const PREFIX = "linkhub-pin-unlock:";

export function getStoredPinToken(folderId) {
  try {
    return sessionStorage.getItem(PREFIX + folderId);
  } catch {
    return null;
  }
}

export function storePinToken(folderId, token) {
  try {
    sessionStorage.setItem(PREFIX + folderId, token);
  } catch {
    // Private browsing / storage disabled — PIN just has to be
    // re-entered next request, not a hard failure.
  }
}

export function clearAllPinTokens() {
  try {
    Object.keys(sessionStorage)
      .filter((key) => key.startsWith(PREFIX))
      .forEach((key) => sessionStorage.removeItem(key));
  } catch {
    // Private browsing / storage disabled — tidak ada yang perlu dibersihkan.
  }
}