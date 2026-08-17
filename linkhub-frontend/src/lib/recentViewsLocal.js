// Pure client-side recent-views for guests — never sent to the
// backend. Logged-in users get server-persisted history instead (see
// api/recentViewApi.js); this is only the fallback for anonymous
// browsing, capped to the last 20 and scoped to this browser only.
const KEY = "linkhub-recent-guest";
const MAX_ITEMS = 20;

function read() {
  try {
    const raw = localStorage.getItem(KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function write(list) {
  try {
    localStorage.setItem(KEY, JSON.stringify(list));
  } catch {
    // storage disabled/full — silently skip, this is a nice-to-have
  }
}

export function addLocalRecentView(entityType, entityId, entityName) {
  const list = read().filter(
    (item) => !(item.entity_type === entityType && item.entity_id === entityId)
  );
  list.unshift({
    entity_type: entityType,
    entity_id: entityId,
    entity_name: entityName,
    viewed_at: new Date().toISOString(),
  });
  write(list.slice(0, MAX_ITEMS));
}

export function listLocalRecentViews() {
  return read();
}
