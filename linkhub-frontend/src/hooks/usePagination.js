import { useState, useCallback } from "react";
import { STANDARD_PAGE_SIZES } from "../lib/pagination";

// Centralizes page/limit state so FolderPage and SearchResultsPage
// don't each reimplement it. `reset()` is called whenever the
// underlying list changes for reasons other than pagination itself
// (folder navigated, filters changed) — always jump back to page 1.
export function usePagination(initialLimit = STANDARD_PAGE_SIZES[0]) {
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(initialLimit);

  const changeLimit = useCallback((newLimit) => {
    setLimit(newLimit);
    setPage(1); // changing page size always restarts at page 1
  }, []);

  const reset = useCallback(() => setPage(1), []);

  return { page, limit, setPage, changeLimit, reset };
}
