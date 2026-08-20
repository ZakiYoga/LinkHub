import PropTypes from "prop-types";
import { Pencil, Trash2 } from "lucide-react";
import ItemIcon from "./ItemIcon.jsx";
import { menuItemShape } from "../types/propTypes";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export default function ItemCard({ item, breadcrumb, canEdit, onOpen, onEdit, onDelete, viewMode = "list" }) {
  const isGrid = viewMode === "grid";

  return (
    <div className="group relative">
      <a
        href={item.url}
        target="_blank"
        rel="noopener noreferrer"
        onClick={onOpen}
        className={cn(
          "flex rounded-lg border p-4 transition hover:border-foreground/30 hover:shadow-sm",
          isGrid ? "h-full flex-col items-center gap-2 text-center" : "items-center gap-3"
        )}
      >
        <ItemIcon
          type={item.type}
          className={isGrid ? "h-10 w-10 shrink-0" : "mt-0.5 h-8 w-8 shrink-0"}
        />

        <div className={isGrid ? "w-full min-w-0" : "min-w-0"}>
          <p
            className={cn(
              "font-medium text-foreground",
              isGrid ? "line-clamp-2 text-sm" : "truncate pr-10"
            )}
          >
            {item.name}
          </p>

          {!isGrid && item.description && (
            <p className="line-clamp-1 text-sm text-muted-foreground">{item.description}</p>
          )}

          {breadcrumb?.length > 0 && (
            <p className="mt-1 truncate text-xs text-muted-foreground">
              {breadcrumb.map((f) => f.name).join(" / ")}
            </p>
          )}

          {item.tags?.length > 0 && (
            <div className={cn("mt-2 flex flex-wrap gap-1", isGrid && "justify-center")}>
              {(isGrid ? item.tags.slice(0, 1) : item.tags).map((t) => (
                <Badge key={t.id} variant="secondary" className="font-normal">
                  {t.name}
                </Badge>
              ))}
              {isGrid && item.tags.length > 1 && (
                <span className="px-1 text-xs text-muted-foreground">+{item.tags.length - 1}</span>
              )}
            </div>
          )}
        </div>
      </a>

      {canEdit && (
        <div className="absolute right-2 top-2 hidden gap-1 group-hover:flex">
          <Button
            type="button"
            variant="outline"
            size="icon"
            className="h-7 w-7 bg-background"
            title="Edit link"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              onEdit(item);
            }}
          >
            <Pencil className="h-3.5 w-3.5" />
          </Button>
          <Button
            type="button"
            variant="outline"
            size="icon"
            className="h-7 w-7 bg-background hover:text-destructive"
            title="Hapus link"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              onDelete(item);
            }}
          >
            <Trash2 className="h-3.5 w-3.5" />
          </Button>
        </div>
      )}
    </div>
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