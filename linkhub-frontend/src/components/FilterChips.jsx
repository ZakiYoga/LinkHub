import PropTypes from "prop-types";
import { cx } from "../lib/utils";

export default function FilterChips({ tags, selectedIds, onToggle }) {
  if (!tags?.length) return null;
  return (
    <div className="flex flex-wrap gap-2">
      {tags.map((tag) => {
        const active = selectedIds.includes(tag.id);
        return (
          <button
            key={tag.id}
            type="button"
            onClick={() => onToggle(tag.id)}
            className={cx(
              "text-sm rounded-full px-3 py-1 border transition",
              active
                ? "bg-blue-600 border-blue-600 text-white"
                : "bg-white border-slate-300 text-slate-600 hover:border-slate-400"
            )}
          >
            {tag.name}
          </button>
        );
      })}
    </div>
  );
}

FilterChips.propTypes = {
  tags: PropTypes.array,
  selectedIds: PropTypes.array.isRequired,
  onToggle: PropTypes.func.isRequired,
};
