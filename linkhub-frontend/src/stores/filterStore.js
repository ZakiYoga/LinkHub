import { create } from "zustand";

export const useFilterStore = create((set) => ({
  query: "",
  type: "",
  tagIds: [],
  sort: "name",
  setQuery: (query) => set({ query }),
  setType: (type) => set({ type }),
  setSort: (sort) => set({ sort }),
  toggleTag: (tagId) =>
    set((s) => ({
      tagIds: s.tagIds.includes(tagId)
        ? s.tagIds.filter((t) => t !== tagId)
        : [...s.tagIds, tagId],
    })),
  clearTags: () => set({ tagIds: [] }),
  reset: () => set({ query: "", type: "", tagIds: [], sort: "name" }),
}));
