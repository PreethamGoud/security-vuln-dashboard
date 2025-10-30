import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { Vulnerability } from "../types/vuln";
import {
  getPage,
  getTotalCount,
  type KaiStatusFilters,
  type SortKey,
} from "../data/query";

export type UseVirtualVulnsOptions = {
  pageSize?: number;
  filters: KaiStatusFilters;
  sort: SortKey;
};

/**
 * Virtualized data source with page cache.
 * - Keeps an in-memory Map of pages to avoid refetch while scrolling
 * - Invalidates cache whenever any filter or sort changes
 */
export function useVirtualVulns({
  pageSize = 100,
  filters,
  sort,
}: UseVirtualVulnsOptions) {
  const pagesRef = useRef(new Map<number, Vulnerability[]>());
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [version, setVersion] = useState(0); // triggers rerender when a page arrives

  const clearCache = useCallback(() => {
    pagesRef.current.clear();
    setVersion((v) => v + 1);
  }, []);

  // Serialize filters so the dependency covers all fields
  const filterKey = JSON.stringify(filters);

  useEffect(() => {
    let alive = true;
    setLoading(true);
    (async () => {
      const t = await getTotalCount(filters);
      if (!alive) return;
      setTotal(t);
      setLoading(false);
      clearCache();
    })();
    return () => {
      alive = false;
    };
  }, [filterKey, sort, clearCache]);

  // Ensure the page containing rowIndex is loaded (idempotent)
  const ensureRow = useCallback(
    async (rowIndex: number) => {
      const pageIndex = Math.floor(rowIndex / pageSize);
      if (pagesRef.current.has(pageIndex)) return;
      const offset = pageIndex * pageSize;
      const items = await getPage(filters, sort, offset, pageSize);
      pagesRef.current.set(pageIndex, items);
      setVersion((v) => v + 1);
    },
    [filters, sort, pageSize]
  );

  const getRow = useCallback(
    (rowIndex: number): Vulnerability | null => {
      const pageIndex = Math.floor(rowIndex / pageSize);
      const within = rowIndex % pageSize;
      const page = pagesRef.current.get(pageIndex);
      if (!page) return null;
      return page[within] ?? null;
    },
    [pageSize, version]
  );

  return useMemo(
    () => ({ total, loading, ensureRow, getRow, pageSize }),
    [total, loading, ensureRow, getRow, pageSize]
  );
}
