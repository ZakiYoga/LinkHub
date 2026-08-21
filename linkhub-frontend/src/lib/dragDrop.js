// Pure decision logic for a drag-drop move, extracted out of
// FolderPage's onDragEnd so it can be unit tested without simulating
// an actual pointer/touch drag (dnd-kit itself is already tested
// upstream — this is just OUR "should this drop even do anything"
// logic, e.g. dropping a folder on itself, or dropping something back
// into the folder it already lives in).
//
// source/target come straight from dnd-kit's `active.data.current` /
// `over.data.current` — see FolderCard.jsx / ItemCard.jsx for the
// shape each drag/drop node registers.

/**
 * @param {{ type: "folder" | "item", id: string, currentParentId: string | null } | null | undefined} source
 * @param {{ type: string, id: string } | null | undefined} target
 * @returns {boolean} true if the drop should be ignored (no API call)
 */
export function shouldSkipDrop(source, target) {
  if (!source || !target) return true;
  // Only folders are drop targets (see FolderCard.jsx).
  if (target.type !== "folder") return true;
  // A folder can't be dropped onto itself.
  if (source.type === "folder" && source.id === target.id) return true;
  // Dropping back into the folder it already lives in is a no-op.
  if (source.currentParentId === target.id) return true;
  return false;
}