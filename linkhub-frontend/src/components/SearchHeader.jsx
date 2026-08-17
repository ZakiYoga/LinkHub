import { useEffect, useState, useRef } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useFilterStore } from "../stores/filterStore";
import { listTags } from "../api/tagApi";
import SearchBar from "./SearchBar.jsx";
import TagFilterDropdown from "./TagFilterDropdown.jsx";

const ITEM_TYPES = [
    { value: "", label: "Semua Tipe" },
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
    const setQuery = useFilterStore((s) => s.setQuery);
    const setType = useFilterStore((s) => s.setType);
    const toggleTag = useFilterStore((s) => s.toggleTag);
    const clearTags = useFilterStore((s) => s.clearTags);
    const reset = useFilterStore((s) => s.reset);

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
    // dirender sekali di App.jsx, di luar <Routes>, jadi dia TIDAK
    // pernah unmount walau navigasi terjadi di keystroke/reset pertama.
    // Delay 300ms untuk pemanggilan API pencarian tetap ada, tapi
    // ditangani terpisah di SearchResultsPage sendiri — bukan di sini.
    useEffect(() => {
        const hasActiveSearch = query.trim() !== "" || type !== "" || tagIds.length > 0;
        if (hasActiveSearch && pathnameRef.current !== "/search") {
            navigate("/search");
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [query, type, tagIds]);

    const hasAnyFilter = query || type || tagIds.length > 0;

    return (
        <div className="border-b border-slate-200 bg-white">
            <div className="max-w-5xl mx-auto px-4 py-3 flex flex-col gap-3 sm:flex-row sm:items-center">
                <div className="flex-1">
                    <SearchBar
                        value={query}
                        onChange={setQuery}
                        placeholder="Cari link di semua folder..."
                    />
                </div>
                <div className="flex items-center gap-2">
                    <select
                        value={type}
                        onChange={(e) => setType(e.target.value)}
                        className="rounded-lg border border-slate-300 px-3 py-1.5 text-sm text-slate-600 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                    >
                        {ITEM_TYPES.map((t) => (
                            <option key={t.value} value={t.value}>
                                {t.label}
                            </option>
                        ))}
                    </select>

                    <TagFilterDropdown
                        tags={tags}
                        selectedIds={tagIds}
                        onToggle={toggleTag}
                        onClear={clearTags}
                    />

                    {hasAnyFilter && (
                        <button type="button" onClick={reset} className="text-xs text-slate-500 hover:text-red-600">
                            Reset
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
}