import PropTypes from "prop-types";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";

// Shared by SearchHeader (global search) and FolderPage (browse mode) —
// only meaningful for logged-in users (guests have no created_by /
// collaborator identity to filter by), so callers should only render
// this when isAuthed is true.
const OWNER_SCOPES = [
    { value: "all", label: "Milik siapa saja" },
    { value: "mine", label: "Milik saya" },
    { value: "shared", label: "Dibagikan ke saya" },
];

export default function OwnerScopeSelect({ value, onChange, className }) {
    return (
        <Select value={value || "all"} onValueChange={onChange}>
            <SelectTrigger className={className ?? "w-42.5"}>
                <SelectValue />
            </SelectTrigger>
            <SelectContent>
                {OWNER_SCOPES.map((s) => (
                    <SelectItem key={s.value} value={s.value}>
                        {s.label}
                    </SelectItem>
                ))}
            </SelectContent>
        </Select>
    );
}

OwnerScopeSelect.propTypes = {
    value: PropTypes.oneOf(["all", "mine", "shared"]),
    onChange: PropTypes.func.isRequired,
    className: PropTypes.string,
};