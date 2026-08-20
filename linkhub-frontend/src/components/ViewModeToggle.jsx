import PropTypes from "prop-types";
import { LayoutGrid, List } from "lucide-react";
import { cn } from "@/lib/utils";

const MODES = [
  { value: "grid", icon: LayoutGrid, label: "Tampilan grid" },
  { value: "list", icon: List, label: "Tampilan list" },
];

export default function ViewModeToggle({ value, onChange }) {
  return (
    <div className="inline-flex items-center rounded-md border bg-background p-0.5">
      {MODES.map(({ value: mode, icon: Icon, label }) => {
        const active = value === mode;
        return (
          <button
            key={mode}
            type="button"
            aria-label={label}
            title={label}
            onClick={() => onChange(mode)}
            className={cn(
              "flex h-8 w-8 items-center justify-center rounded-sm transition-colors",
              active
                ? "bg-blue-600 text-white"
                : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
            )}
          >
            <Icon className="h-3.5 w-3.5" />
          </button>
        );
      })}
    </div>
  );
}

ViewModeToggle.propTypes = {
  value: PropTypes.oneOf(["grid", "list"]).isRequired,
  onChange: PropTypes.func.isRequired,
};