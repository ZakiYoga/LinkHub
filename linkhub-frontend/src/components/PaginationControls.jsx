import PropTypes from "prop-types";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { getPageSizeOptions } from "../lib/pagination";

// Dropdown page-size options adapt to the total item count (see
// getPageSizeOptions) — a folder with 24 items only offers "10" and
// "25", not the full 10/25/50/100 tier list.
export default function PaginationControls({ page, limit, total, onPageChange, onLimitChange }) {
  const totalPages = Math.max(1, Math.ceil(total / limit));
  const options = getPageSizeOptions(total);

  if (total === 0) return null;

  return (
    <div className="mt-auto flex flex-wrap items-center justify-between gap-3 text-sm text-muted-foreground">
      <div className="mt-6 flex items-center gap-2">
        <span>Tampilkan</span>
        <Select value={String(limit)} onValueChange={(v) => onLimitChange(Number(v))}>
          <SelectTrigger className="h-8 w-[70px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {options.map((size) => (
              <SelectItem key={size} value={String(size)}>
                {size}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <span>dari {total} item</span>
      </div>

      {totalPages > 1 && (
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="icon"
            className="h-8 w-8"
            onClick={() => onPageChange(page - 1)}
            disabled={page <= 1}
          >
            <ChevronLeft className="h-3.5 w-3.5" />
          </Button>
          <span>
            Halaman {page} / {totalPages}
          </span>
          <Button
            variant="outline"
            size="icon"
            className="h-8 w-8"
            onClick={() => onPageChange(page + 1)}
            disabled={page >= totalPages}
          >
            <ChevronRight className="h-3.5 w-3.5" />
          </Button>
        </div>
      )}
    </div>
  );
}

PaginationControls.propTypes = {
  page: PropTypes.number.isRequired,
  limit: PropTypes.number.isRequired,
  total: PropTypes.number.isRequired,
  onPageChange: PropTypes.func.isRequired,
  onLimitChange: PropTypes.func.isRequired,
};