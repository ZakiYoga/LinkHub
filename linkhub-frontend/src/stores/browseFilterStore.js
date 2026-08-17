import { create } from "zustand";

// Filter khusus mode browse (di dalam FolderPage) — terpisah dari
// filterStore yang dipakai SearchHeader/SearchResultsPage untuk search
// global, supaya keduanya tidak saling menimpa state.
export const useBrowseFilterStore = create((set) => ({
  type: "",
  tagIds: [],
  sort: "name",
  setType: (type) => set({ type }),
  setSort: (sort) => set({ sort }),
  toggleTag: (tagId) =>
    set((s) => ({
      tagIds: s.tagIds.includes(tagId)
        ? s.tagIds.filter((t) => t !== tagId)
        : [...s.tagIds, tagId],
    })),
  clearTags: () => set({ tagIds: [] }),
}));