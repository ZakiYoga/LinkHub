// Minimal JWT payload decoder — no signature verification (the backend
// already verifies every request; the frontend only needs the claims
// to drive UI, never for security decisions).
export function decodeJwt(token) {
  try {
    const payload = token.split(".")[1];
    const json = atob(payload.replace(/-/g, "+").replace(/_/g, "/"));
    return JSON.parse(json);
  } catch {
    return null;
  }
}
