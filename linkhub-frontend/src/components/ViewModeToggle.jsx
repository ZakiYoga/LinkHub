import PropTypes from "prop-types";
import { FaTh, FaListUl } from "react-icons/fa";
import { cx } from "../lib/utils";

const MODES = [
    { value: "grid", icon: FaTh, label: "Tampilan grid" },
    { value: "list", icon: FaListUl, label: "Tampilan list" },
];

export default function ViewModeToggle({ value, onChange }) {
    return (
        <div className="inline-flex items-center rounded-lg border border-slate-300 bg-white p-0.5">
            {MODES.map(({ value: mode, icon: Icon, label }) => {
                const active = value === mode;
                return (
                    <button
                        key={mode}
                        type="button"
                        aria-label={label}
                        title={label}
                        onClick={() => onChange(mode)}
                        className={cx(
                            "flex h-8 w-8 items-center justify-center rounded-md transition",
                            active ? "bg-blue-600 text-white" : "text-slate-500 hover:bg-slate-100"
                        )}
                    >
                        <Icon size={14} />
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