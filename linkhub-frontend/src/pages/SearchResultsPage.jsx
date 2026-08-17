import { useEffect, useRef, useState } from "react";
import { useSearchParams, Link } from "react-router-dom";
import { search } from "../api/searchApi";
import { useFilterStore } from "../stores/filterStore";
import { useDebounce } from "../hooks/useDebounce";
import { useLocalStorage } from "../hooks/useLocalStorage";
import ItemCard from "../components/ItemCard.jsx";
import { useViewMode } from "../hooks/useViewMode.js";

export default function SearchResultsPage() {
  const [searchParams, setSearchParams] = useSearchParams();

  const query = useFilterStore((s) => s.query);
  const type = useFilterStore((s) => s.type);
  const tagIds = useFilterStore((s) => s.tagIds);
  const setQuery = useFilterStore((s) => s.setQuery);
  const setType = useFilterStore((s) => s.setType);
  const toggleTag = useFilterStore((s) => s.toggleTag);
  const resetFilter = useFilterStore((s) => s.reset);

  const { viewMode, setViewMode, folderGridClass, itemGridClass } = useViewMode();

  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const debouncedQuery = useDebounce(query, 300);

  const hydrated = useRef(false);
  useEffect(() => {
    if (hydrated.current) return;
    hydrated.current = true;
    const q = searchParams.get("q");
    const t = searchParams.get("type");
    const tagParam = searchParams.get("tag");
    if (q) setQuery(q);
    if (t) setType(t);
    if (tagParam) tagParam.split(",").forEach((id) => id && toggleTag(id));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const hasFilter = debouncedQuery.trim() !== "" || type !== "" || tagIds.length > 0;

  useEffect(() => {
    const params = {};
    if (debouncedQuery) params.q = debouncedQuery;
    if (type) params.type = type;
    if (tagIds.length > 0) params.tag = tagIds.join(",");
    setSearchParams(params);

    if (!hasFilter) {
      setResults([]);
      return;
    }
    setLoading(true);
    setError(null);
    search(params)
      .then((data) => setResults(data.items || []))
      .catch(() => setError("Gagal memuat hasil pencarian."))
      .finally(() => setLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debouncedQuery, type, tagIds]);

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      <Link to="/" onClick={resetFilter} className="text-sm text-blue-600 hover:underline">
        &larr; Kembali ke Halaman utama
      </Link>
      <h1 className="text-2xl font-bold text-slate-900 my-4">Pencarian</h1>

      {loading && <p className="text-slate-400">Mencari...</p>}
      {error && <p className="text-red-600">{error}</p>}
      {!loading && !error && hasFilter && results.length === 0 && (
        <p className="text-slate-400">Tidak ada hasil ditemukan.</p>
      )}
      {!loading && !error && !hasFilter && (
        <p className="text-slate-400">
          Ketik kata kunci atau pilih filter di atas untuk mulai mencari.
        </p>
      )}

      <div className={itemGridClass}>
        {results.map((item) => (
          <ItemCard key={item.id} item={item} viewMode={viewMode} breadcrumb={item.breadcrumb} />
        ))}
      </div>
    </div>
  );
}