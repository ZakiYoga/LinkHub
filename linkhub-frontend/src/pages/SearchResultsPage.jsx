import { useEffect, useRef, useState } from "react";
import { useSearchParams, Link } from "react-router-dom";
import { search } from "../api/searchApi";
import { useFilterStore } from "../stores/filterStore";
import { useDebounce } from "../hooks/useDebounce";
import ItemCard from "../components/ItemCard.jsx";
import { useViewMode } from "../hooks/useViewMode.js";

export default function SearchResultsPage() {
  const [searchParams, setSearchParams] = useSearchParams();

  const query = useFilterStore((s) => s.query);
  const type = useFilterStore((s) => s.type);
  const tagIds = useFilterStore((s) => s.tagIds);
  const ownerScope = useFilterStore((s) => s.ownerScope);
  const setQuery = useFilterStore((s) => s.setQuery);
  const setType = useFilterStore((s) => s.setType);
  const toggleTag = useFilterStore((s) => s.toggleTag);
  const setOwnerScope = useFilterStore((s) => s.setOwnerScope);
  const resetFilter = useFilterStore((s) => s.reset);

  const { viewMode, itemGridClass } = useViewMode();

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
    const scope = searchParams.get("owner_scope");
    if (q) setQuery(q);
    if (t) setType(t);
    if (tagParam) tagParam.split(",").forEach((id) => id && toggleTag(id));
    if (scope === "mine" || scope === "shared") setOwnerScope(scope);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const hasFilter =
    debouncedQuery.trim() !== "" || type !== "" || tagIds.length > 0 || ownerScope !== "all";

  useEffect(() => {
    const params = {};
    if (debouncedQuery) params.q = debouncedQuery;
    if (type) params.type = type;
    if (tagIds.length > 0) params.tag = tagIds.join(",");
    if (ownerScope !== "all") params.owner_scope = ownerScope;
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
  }, [debouncedQuery, type, tagIds, ownerScope]);

  return (
    <div className="mx-auto max-w-5xl px-4 py-8">
      <Link to="/" onClick={resetFilter} className="text-sm text-primary hover:underline">
        &larr; Kembali ke Root
      </Link>
      <h1 className="my-4 text-2xl font-bold text-foreground">Pencarian</h1>

      {loading && <p className="text-muted-foreground">Mencari...</p>}
      {error && <p className="text-destructive">{error}</p>}
      {!loading && !error && hasFilter && results.length === 0 && (
        <p className="text-muted-foreground">Tidak ada hasil ditemukan.</p>
      )}
      {!loading && !error && !hasFilter && (
        <p className="text-muted-foreground">
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