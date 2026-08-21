import PropTypes from "prop-types";
import { Link } from "react-router-dom";
import { Folder, MoreVertical, Users, Pencil, Trash2, KeyRound } from "lucide-react";
import { useDraggable, useDroppable } from "@dnd-kit/core";
import { folderShape } from "../types/propTypes";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";

// canEdit: owner or admin — allowed to rename/delete this folder. Also
// gates whether the card can be picked up and dragged: moving a folder
// requires the same permission as editing it (backend enforces this
// too, in FolderService.Update — this is just the matching frontend
// gate so people don't drag something they can't actually move).
//
// The card is always a drop TARGET regardless of canEdit, because
// authorization for *receiving* a moved folder/item depends on access
// to the destination, not the card being dragged — the backend is the
// real gate; disallowed drops just come back as an error toast.
export default function FolderCard({ folder, canEdit, onEdit, onDelete, onManageCollaborators, onManagePin }) {
  const draggable = useDraggable({
    id: `folder-${folder.id}`,
    data: { type: "folder", id: folder.id, currentParentId: folder.parent_id ?? null },
    disabled: !canEdit,
  });
  const droppable = useDroppable({
    id: `folder-${folder.id}`,
    data: { type: "folder", id: folder.id },
  });

  return (
    <div
      ref={(node) => {
        draggable.setNodeRef(node);
        droppable.setNodeRef(node);
      }}
      className={cn(
        "group relative rounded-lg transition-opacity",
        draggable.isDragging && "opacity-40",
        droppable.isOver && "ring-2 ring-primary ring-offset-1"
      )}
    >
      <Link
        to={`/folder/${folder.id}`}
        // Same reasoning as ItemCard.jsx: only spread dnd-kit's
        // listeners/attributes when dragging is enabled, otherwise its
        // role="button" override breaks the Link's native role="link"
        // semantics for guests/non-owners who can't drag anyway.
        {...(canEdit ? draggable.listeners : {})}
        {...(canEdit ? draggable.attributes : {})}
        className="flex items-center gap-3 rounded-lg border p-4 transition hover:border-foreground/30 hover:shadow-sm"
      >
        <Folder className="h-8 w-8 shrink-0 fill-amber-400 text-amber-500/60" />
        <span className="truncate pr-8 font-medium text-foreground">{folder.name}</span>
      </Link>

      {canEdit && (
        <div className="absolute right-2 top-2 opacity-0 transition-opacity group-hover:opacity-100 focus-within:opacity-100">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="outline"
                size="icon"
                className="h-7 w-7 bg-background"
                onClick={(e) => e.preventDefault()}
                title="Opsi lainnya"
              >
                <MoreVertical className="h-3.5 w-3.5" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" onCloseAutoFocus={(e) => e.preventDefault()}>
              <DropdownMenuItem onSelect={() => onManagePin(folder)}>
                <KeyRound /> Kelola PIN
              </DropdownMenuItem>
              <DropdownMenuItem onSelect={() => onManageCollaborators(folder)}>
                <Users /> Kelola kolaborator
              </DropdownMenuItem>
              <DropdownMenuItem onSelect={() => onEdit(folder)}>
                <Pencil /> Edit folder
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onSelect={() => onDelete(folder)}
                className="text-destructive focus:text-destructive"
              >
                <Trash2 /> Hapus folder
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      )}
    </div>
  );
}

FolderCard.propTypes = {
  folder: folderShape.isRequired,
  canEdit: PropTypes.bool,
  onEdit: PropTypes.func,
  onDelete: PropTypes.func,
  onManageCollaborators: PropTypes.func,
  onManagePin: PropTypes.func,
};