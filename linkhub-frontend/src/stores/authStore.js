import { create } from "zustand";
import { persist } from "zustand/middleware";
import { decodeJwt } from "../lib/jwt";
import { clearAllPinTokens } from "../lib/pinStorage";

// `user` is derived once at login time from the JWT's `sub`/`role`
// claims and persisted alongside the token, so every part of the app
// that needs "am I logged in" / "am I admin" / "is this mine" reads
// from here instead of re-decoding the token or hitting an API.
export const useAuthStore = create(
  persist(
    (set) => ({
      token: null,
      user: null,

      login: (token) => {
        const claims = decodeJwt(token);
        clearAllPinTokens();
        set({
          token,
          user: claims ? { id: claims.sub, role: claims.role } : null,
        });
      },
      logout: () => {
        clearAllPinTokens();
        set({ token: null, user: null });
      },
    }),
    { name: "linkhub-auth" }
  )
);

// Convenience selectors so components don't each re-derive this logic.
export const selectIsAuthed = (s) => Boolean(s.user);
export const selectIsAdmin = (s) => s.user?.role === "admin";

// True if the current user owns the given entity (has created_by ===
// their id) or is admin — the same rule the backend enforces
// server-side (CanEditFolder/CanEditItem). UI-side, this only controls
// which buttons are shown; the backend is still the source of truth.
export function canEditEntity(user, entity) {
  if (!user || !entity) return false;
  return user.role === "admin" || entity.created_by === user.id;
}
