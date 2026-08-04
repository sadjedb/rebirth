export type SortDirection = "asc" | "desc";

/** Parses a 1-indexed page number from a URL param, falling back safely. */
export function parsePage(value: string | undefined, fallback = 1): number {
  const n = Number(value);
  return Number.isInteger(n) && n > 0 ? n : fallback;
}

/**
 * Builds a URL that keeps every current search param except the ones being
 * updated (or removed, via `undefined`). Every DataTable control (sort
 * header, pagination, filter select) uses this instead of hand-building
 * query strings, so "change one thing, keep the rest" is never
 * reimplemented per module.
 */
export function buildListUrl(
  pathname: string,
  current: URLSearchParams | Record<string, string | undefined>,
  updates: Record<string, string | undefined>
): string {
  const params = new URLSearchParams(
    current instanceof URLSearchParams ? current.toString() : undefined
  );

  if (!(current instanceof URLSearchParams)) {
    for (const [key, value] of Object.entries(current)) {
      if (value) params.set(key, value);
    }
  }

  for (const [key, value] of Object.entries(updates)) {
    if (value === undefined || value === "") {
      params.delete(key);
    } else {
      params.set(key, value);
    }
  }

  // Any change other than an explicit page update resets pagination —
  // changing the search term or a filter while sitting on page 4 of the
  // old result set would otherwise show a confusing out-of-range page.
  if (!("page" in updates)) {
    params.delete("page");
  }

  const qs = params.toString();
  return qs ? `${pathname}?${qs}` : pathname;
}

export const DEFAULT_PAGE_SIZE = 20;
