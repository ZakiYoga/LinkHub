import { useState, useRef, useEffect } from "react";
import PropTypes from "prop-types";
import { Link } from "react-router-dom";
import { FaFolder, FaPen, FaTrash, FaUsers, FaEllipsisV, FaKey } from "react-icons/fa";
import { folderShape } from "../types/propTypes";

// canEdit: owner or admin — allowed to rename/delete this folder.
// canManageCollaborators mirrors canEdit on the backend (owner or
// admin), so it's the same value; kept as a separate prop in case that
// ever diverges.
export default function FolderCard({ folder, canEdit, onEdit, onDelete, onManageCollaborators, onManagePin }) {
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef(null);

  useEffect(() => {
    if (!menuOpen) return;

    function handleClickOutside(e) {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setMenuOpen(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [menuOpen]);

  function handleAction(e, action) {
    e.preventDefault();
    e.stopPropagation();
    setMenuOpen(false);
    action(folder);
  }

  return (
    <div className="relative group">
      <Link
        to={`/folder/${folder.id}`}
        className="flex items-center gap-3 rounded-lg border border-slate-200 p-4 hover:border-slate-400 hover:shadow-sm transition"
      >
        <FaFolder className="text-amber-500 text-xl shrink-0" />
        <span className="font-medium text-slate-800 truncate pr-8">{folder.name}</span>
      </Link>

      {canEdit && (
        <div
          className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 focus-within:opacity-100"
          ref={menuRef}
        >
          <button
            type="button"
            title="Opsi lainnya"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              setMenuOpen((prev) => !prev);
            }}
            className="p-1.5 rounded bg-white border border-slate-200 text-slate-500 hover:text-slate-700"
          >
            <FaEllipsisV size={12} />
          </button>

          {menuOpen && (
            <div className="absolute right-0 mt-1 w-44 rounded-lg border border-slate-200 bg-white shadow-lg py-1 z-10">
              <button
                type="button"
                title="Kelola PIN"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  onManagePin(folder);
                }}
                className="p-1.5 rounded bg-white border border-slate-200 text-slate-500 hover:text-amber-600"
              >
                <FaKey size={12} />
              </button>
              <button
                type="button"
                onClick={(e) => handleAction(e, onManageCollaborators)}
                className="flex items-center gap-2 w-full px-3 py-2 text-sm text-slate-600 hover:bg-slate-50 hover:text-purple-600"
              >
                <FaUsers size={12} />
                Kelola kolaborator
              </button>
              <button
                type="button"
                onClick={(e) => handleAction(e, onEdit)}
                className="flex items-center gap-2 w-full px-3 py-2 text-sm text-slate-600 hover:bg-slate-50 hover:text-blue-600"
              >
                <FaPen size={12} />
                Edit folder
              </button>
              <button
                type="button"
                onClick={(e) => handleAction(e, onDelete)}
                className="flex items-center gap-2 w-full px-3 py-2 text-sm text-slate-600 hover:bg-slate-50 hover:text-red-600"
              >
                <FaTrash size={12} />
                Hapus folder
              </button>
            </div>
          )}
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