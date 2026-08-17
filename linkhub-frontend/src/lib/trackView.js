import { useAuthStore, selectIsAuthed } from "../stores/authStore";
import { trackRecentView } from "../api/recentViewApi";
import { addLocalRecentView } from "./recentViewsLocal";

// Single entry point every page/component calls to record a view —
// callers never branch on auth state themselves. Logged-in -> server
// (cross-device history). Guest -> localStorage only (never touches
// the backend at all, see recentViewsLocal.js for the reasoning).
export function trackView(entityType, entityId, entityName) {
  const isAuthed = selectIsAuthed(useAuthStore.getState());
  if (isAuthed) {
    trackRecentView(entityType, entityId, entityName).catch(() => {
      // Best-effort — a failed view-tracking call shouldn't interrupt browsing.
    });
  } else {
    addLocalRecentView(entityType, entityId, entityName);
  }
}
