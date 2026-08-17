import PropTypes from "prop-types";
import { FaPen, FaTrash } from "react-icons/fa";
import ItemIcon from "./ItemIcon.jsx";
import { menuItemShape } from "../types/propTypes";

export default function ItemCard({ item, breadcrumb, canEdit, onOpen, onEdit, onDelete, viewMode = "list" }) {
  const isGrid = viewMode === "grid";

  return (
    <div className="relative group">
      <a
        href={item.url}
        target="_blank"
        rel="noopener noreferrer"
        className={
          isGrid
            ? "flex flex-col items-center text-center gap-2 rounded-lg border border-slate-200 p-4 hover:border-slate-400 hover:shadow-sm transition h-full"
            : "flex items-center gap-3 rounded-lg border border-slate-200 p-4 hover:border-slate-400 hover:shadow-sm transition"
        }
      >
        <ItemIcon
          type={item.type}
          className={isGrid ? "w-10 h-10 shrink-0" : "w-8 h-8 shrink-0 mt-0.5"}
        />

        <div className={isGrid ? "min-w-0 w-full" : "min-w-0"}>
          <p
            className={
              isGrid
                ? "font-medium text-slate-800 text-sm line-clamp-2"
                : "font-medium text-slate-800 truncate pr-10"
            }
          >
            {item.name}
          </p>

          {/* Deskripsi: tampil di list (2 baris), disembunyikan di grid */}
          {!isGrid && item.description && (
            <p className="text-sm text-slate-500 line-clamp-1">{item.description}</p>
          )}

          {/* Breadcrumb: tampil di keduanya, tapi lebih pendek di grid */}
          {breadcrumb?.length > 0 && (
            <p
              className={
                isGrid
                  ? "text-xs text-slate-400 mt-1 truncate"
                  : "text-xs text-slate-400 mt-1 truncate"
              }
            >
              {breadcrumb.map((f) => f.name).join(" / ")}
            </p>
          )}

          {/* Tags: full di list, maksimal 1 tag + counter di grid */}
          {item.tags?.length > 0 && (
            <div className={isGrid ? "flex flex-wrap justify-center gap-1 mt-2" : "flex flex-wrap gap-1 mt-2"}>
              {(isGrid ? item.tags.slice(0, 1) : item.tags).map((t) => (
                <span
                  key={t.id}
                  className="text-xs bg-slate-100 text-slate-600 rounded-full px-2 py-0.5"
                >
                  {t.name}
                </span>
              ))}
              {isGrid && item.tags.length > 1 && (
                <span className="text-xs text-slate-400 px-1">+{item.tags.length - 1}</span>
              )}
            </div>
          )}
        </div>
      </a>

      {
        canEdit && (
          <div className={isGrid ? "absolute top-2 right-2 hidden group-hover:flex gap-1" : "absolute top-2 right-2 hidden group-hover:flex gap-1"}>
            <button
              type="button"
              title="Edit link"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                onEdit(item);
              }}
              className="p-1.5 rounded bg-white border border-slate-200 text-slate-500 hover:text-blue-600"
            >
              <FaPen size={12} />
            </button>
            <button
              type="button"
              title="Hapus link"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                onDelete(item);
              }}
              className="p-1.5 rounded bg-white border border-slate-200 text-slate-500 hover:text-red-600"
            >
              <FaTrash size={12} />
            </button>
          </div>
        )
      }
    </div >
  );
}

ItemCard.propTypes = {
  item: menuItemShape.isRequired,
  breadcrumb: PropTypes.array,
  canEdit: PropTypes.bool,
  onEdit: PropTypes.func,
  onOpen: PropTypes.func,
  onDelete: PropTypes.func,
  viewMode: PropTypes.oneOf(["list", "grid"]),
};