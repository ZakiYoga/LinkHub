import { useEffect, useState, useRef } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useFilterStore } from "../stores/filterStore";
import { useAuthStore, selectIsAuthed } from "../stores/authStore";
import { listTags } from "../api/tagApi";
import SearchBar from "./SearchBar.jsx";
import TagFilterDropdown from "./TagFilterDropdown.jsx";
import OwnerScopeSelect from "./OwnerScopeSelect.jsx";
import { Button } from "@/components/ui/button";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";

const ITEM_TYPES = [
    { value: "all", label: "Semua Tipe" },
    { value: "spreadsheet", label: "Spreadsheet" },
    { value: "slides", label: "Slides" },
    { value: "drive", label: "Drive" },
    { value: "document", label: "Document" },
    { value: "form", label: "Form" },
    { value: "other", label: "Lainnya" },
];

export default function SearchHeader() {
    const query = useFilterStore((s) => s.query);
    const type = useFilterStore((s) => s.type);
    const tagIds = useFilterStore((s) => s.tagIds);
    const ownerScope = useFilterStore((s) => s.ownerScope);
    const setQuery = useFilterStore((s) => s.setQuery);
    const setType = useFilterStore((s) => s.setType);
    const toggleTag = useFilterStore((s) => s.toggleTag);
    const clearTags = useFilterStore((s) => s.clearTags);
    const setOwnerScope = useFilterStore((s) => s.setOwnerScope);
    const reset = useFilterStore((s) => s.reset);
    const isAuthed = useAuthStore(selectIsAuthed);

    const [tags, setTags] = useState([]);
    const navigate = useNavigate();
    const location = useLocation();

    useEffect(() => {
        listTags().then(setTags).catch(() => setTags([]));
    }, []);

    const pathnameRef = useRef(location.pathname);
    useEffect(() => {
        pathnameRef.current = location.pathname;
    }, [location.pathname]);

    // Dipicu langsung dari nilai mentah (bukan debounced) — SearchHeader
    // dirender di dalam MainLayout (lihat src/layouts/MainLayout.jsx),
    // yang tetap tidak unmount saat berpindah antar route DI DALAM
    // layout itu (mis. "/" -> "/search"), jadi pathnameRef masih perlu
    // untuk menghindari navigate() berulang di render yang sama.
    useEffect(() => {
        const hasActiveSearch =
            query.trim() !== "" || type !== "" || tagIds.length > 0 || ownerScope !== "all";
        if (hasActiveSearch && pathnameRef.current !== "/search") {
            navigate("/search");
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [query, type, tagIds, ownerScope]);

    const hasAnyFilter = query || type || tagIds.length > 0 || ownerScope !== "all";

    return (
        <div className="border-b bg-background">
            <div className="mx-auto flex max-w-5xl flex-col gap-3 px-4 py-3 sm:flex-row sm:items-center">
                <div className="flex-1">
                    <SearchBar
                        value={query}
                        onChange={setQuery}
                        placeholder="Cari link di semua folder..."
                    />
                </div>
                <div className="flex items-center gap-2">
                    <Select value={type || "all"} onValueChange={(v) => setType(v === "all" ? "" : v)}>
                        <SelectTrigger className="w-37.5">
                            <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                            {ITEM_TYPES.map((t) => (
                                <SelectItem key={t.value} value={t.value}>
                                    {t.label}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>

                    <TagFilterDropdown
                        tags={tags}
                        selectedIds={tagIds}
                        onToggle={toggleTag}
                        onClear={clearTags}
                    />

                    {isAuthed && (
                        <OwnerScopeSelect value={ownerScope} onChange={setOwnerScope} />
                    )}

                    {hasAnyFilter && (
                        <Button variant="link" size="sm" className="text-muted-foreground" onClick={reset}>
                            Reset
                        </Button>
                    )}
                </div>
            </div>
        </div>
    );
}