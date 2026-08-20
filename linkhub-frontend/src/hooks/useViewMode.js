import { useLocalStorage } from "./useLocalStorage";

export function useViewMode() {
  const [viewMode, setViewMode] = useLocalStorage("linkhub:viewMode", "grid");

  const folderGridClass =
    viewMode === "list"
      ? "flex flex-col gap-2"
      : "grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3";

  const itemGridClass =
    viewMode === "list"
      ? "flex flex-col gap-2"
      : "grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3";

  return { viewMode, setViewMode, folderGridClass, itemGridClass };
}