import PropTypes from "prop-types";
import { Link } from "react-router-dom";
import { useDroppable } from "@dnd-kit/core";
import {
  Breadcrumb as BreadcrumbRoot,
  BreadcrumbList,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { cn } from "@/lib/utils";

// Registers this crumb as a dnd-kit drop target — same {type: "folder",
// id} data shape FolderCard.jsx uses, so FolderPage's handleDragEnd
// handles a breadcrumb drop identically to a FolderCard drop, no
// special-casing needed there. Must render inside FolderPage's
// <DndContext> to actually register.
function DroppableCrumb({ to, dropId, droppable, children }) {
  const drop = useDroppable({
    id: `breadcrumb-${dropId ?? "root"}`,
    data: { type: "folder", id: dropId },
    disabled: !droppable,
  });

  return (
    <BreadcrumbLink asChild>
      <Link
        ref={drop.setNodeRef}
        to={to}
        className={cn(
          "rounded px-1 py-0.5 -mx-1 transition-colors",
          drop.isOver && "bg-primary/10 text-primary ring-1 ring-primary"
        )}
      >
        {children}
      </Link>
    </BreadcrumbLink>
  );
}

DroppableCrumb.propTypes = {
  to: PropTypes.string.isRequired,
  dropId: PropTypes.string,
  droppable: PropTypes.bool.isRequired,
  children: PropTypes.node.isRequired,
};

// currentFolderId: the folder currently being browsed (undefined/null
// at root). Only ancestors — every crumb EXCEPT the one representing
// the currently open folder — are valid drop targets. This is
// deliberate, not an oversight: dropping something into the folder
// it's already sitting in is a no-op FolderPage already ignores
// (shouldSkipDrop), but more importantly it doubles as an accidental
// "undo shield" — a person who fumbles a drag can't re-drop onto the
// same crumb they just dragged FROM to silently cancel their move
// without noticing; they'd have to use the toast's explicit
// "Urungkan" action instead, which is unambiguous about what's
// happening.
export default function Breadcrumb({ items, currentFolderId }) {
  const isAtRoot = !currentFolderId;

  return (
    <BreadcrumbRoot className="mb-4">
      <BreadcrumbList>
        <BreadcrumbItem>
          <DroppableCrumb to="/" dropId={null} droppable={!isAtRoot}>
            Root
          </DroppableCrumb>
        </BreadcrumbItem>
        {items.map((f, index) => {
          const isCurrent = index === items.length - 1;
          return (
            <span key={f.id} className="contents">
              <BreadcrumbSeparator />
              <BreadcrumbItem>
                <DroppableCrumb to={`/folder/${f.id}`} dropId={f.id} droppable={!isCurrent}>
                  {f.name}
                </DroppableCrumb>
              </BreadcrumbItem>
            </span>
          );
        })}
      </BreadcrumbList>
    </BreadcrumbRoot>
  );
}

Breadcrumb.propTypes = {
  items: PropTypes.array.isRequired,
  currentFolderId: PropTypes.string,
};