import { useRef, useState } from "react";
import PropTypes from "prop-types";
import { GoChevronDown } from "react-icons/go";
import { useClickOutside } from "../hooks/useClickOutside";
import { cx } from "../lib/utils";

export default function TagFilterDropdown({ tags, selectedIds, onToggle, onClear }) {
    const [open, setOpen] = useState(false);
    const containerRef = useRef(null);

    useClickOutside(containerRef, () => setOpen(false));

    if (!tags?.length) return null;

    const selectedCount = selectedIds.length;

    return (
        <div ref={containerRef} className="relative">
            <button
                type="button"
                onClick={() => setOpen((o) => !o)}
                className={cx(
                    "flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-sm transition focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500",
                    open
                        ? "border-blue-500 ring-1 ring-blue-500"
                        : selectedCount > 0
                            ? "border-blue-600 bg-blue-50 text-blue-600"
                            : "border-slate-300 text-slate-600 hover:border-slate-400"
                )}
            >
                Tags
                {selectedCount > 0 && (
                    <span className="flex h-5 w-5 items-center justify-center rounded-full bg-blue-600 text-xs text-white">
                        {selectedCount}
                    </span>
                )}
                <GoChevronDown size={16} className={cx("transition-transform", open && "rotate-180")} />
            </button>

            {open && (
                <div className="absolute z-10 mt-2 w-56 rounded-lg border border-slate-200 bg-white py-2 shadow-lg">
                    <div className="max-h-60 overflow-y-auto px-2">
                        {tags.map((tag) => {
                            const checked = selectedIds.includes(tag.id);
                            return (
                                <label
                                    key={tag.id}
                                    className="flex cursor-pointer items-center gap-2 rounded-md px-2 py-1.5 text-sm text-slate-700 hover:bg-slate-50"
                                >
                                    <input
                                        type="checkbox"
                                        checked={checked}
                                        onChange={() => onToggle(tag.id)}
                                        className="rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                                    />
                                    {tag.name}
                                </label>
                            );
                        })}
                    </div>

                    {selectedCount > 0 && (
                        <div className="mt-1 border-t border-slate-100 px-2 pt-2">
                            <button
                                type="button"
                                onClick={onClear}
                                className="text-xs text-slate-500 hover:text-red-600"
                            >
                                Clear ({selectedCount})
                            </button>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}

TagFilterDropdown.propTypes = {
    tags: PropTypes.array,
    selectedIds: PropTypes.array.isRequired,
    onToggle: PropTypes.func.isRequired,
    onClear: PropTypes.func.isRequired,
};