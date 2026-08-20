import PropTypes from "prop-types";
import { ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Popover, PopoverTrigger, PopoverContent } from "@/components/ui/popover";

export default function TagFilterDropdown({ tags, selectedIds, onToggle, onClear }) {
  if (!tags?.length) return null;

  const selectedCount = selectedIds.length;

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          variant={selectedCount > 0 ? "secondary" : "outline"}
          size="sm"
          className="gap-1.5"
        >
          Tags
          {selectedCount > 0 && (
            <Badge className="h-5 w-5 justify-center rounded-full p-0">{selectedCount}</Badge>
          )}
          <ChevronDown className="h-3.5 w-3.5 opacity-60" />
        </Button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-56 p-2">
        <div className="max-h-60 space-y-1 overflow-y-auto">
          {tags.map((tag) => {
            const checked = selectedIds.includes(tag.id);
            return (
              <Label
                key={tag.id}
                className="flex cursor-pointer items-center gap-2 rounded-md px-2 py-1.5 text-sm font-normal hover:bg-accent"
              >
                <Checkbox checked={checked} onCheckedChange={() => onToggle(tag.id)} />
                {tag.name}
              </Label>
            );
          })}
        </div>

        {selectedCount > 0 && (
          <div className="mt-1 border-t pt-2">
            <Button variant="link" size="sm" className="h-auto p-0 text-xs" onClick={onClear}>
              Clear ({selectedCount})
            </Button>
          </div>
        )}
      </PopoverContent>
    </Popover>
  );
}

TagFilterDropdown.propTypes = {
  tags: PropTypes.array,
  selectedIds: PropTypes.array.isRequired,
  onToggle: PropTypes.func.isRequired,
  onClear: PropTypes.func.isRequired,
};