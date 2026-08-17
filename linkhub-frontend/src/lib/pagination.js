// Standard page-size tiers offered in the dropdown.
export const STANDARD_PAGE_SIZES = [10, 25, 50, 100];

// Returns only the tiers that make sense for the current total item
// count — e.g. total=24 -> [10, 25] (25 already covers everything, no
// point offering 50/100). total=0/small -> [10] (the smallest tier).
// total > largest tier -> all tiers, since even 100/page won't show
// everything in one screen.
export function getPageSizeOptions(total) {
  if (!total || total <= 0) return [STANDARD_PAGE_SIZES[0]];

  const covering = STANDARD_PAGE_SIZES.find((size) => size >= total);
  if (covering === undefined) return STANDARD_PAGE_SIZES;

  return STANDARD_PAGE_SIZES.filter((size) => size <= covering);
}
