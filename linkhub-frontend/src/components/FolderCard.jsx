import PropTypes from "prop-types";
import { Link } from "react-router-dom";
import { Folder, MoreVertical, Users, Pencil, Trash2, KeyRound, FolderLock } from "lucide-react";
import { folderShape } from "../types/propTypes";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";

// canEdit: owner or admin — allowed to rename/delete this folder.
// canManageCollaborators mirrors canEdit on the backend (owner or
// admin), so it's the same value; kept as a separate prop in case that
// ever diverges.
export default function FolderCard({ folder, canEdit, onEdit, onDelete, onManageCollaborators, onManagePin }) {
  return (
    <div className="group relative">
      <Link
        to={`/folder/${folder.id}`}
        className="flex items-center gap-3 rounded-lg border p-4 transition hover:border-foreground/30 hover:shadow-sm"
      >
        {folder.pin_protected ? (
          <FolderLock className="h-8 w-8 shrink-0 fill-amber-400 text-amber-700/60" />
        ) : (
          <Folder className="h-8 w-8 shrink-0 fill-amber-400 text-amber-600/60" />
        )}
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