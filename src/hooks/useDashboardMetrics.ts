import { useQuery } from "@tanstack/react-query";
import {
  getSeverityBuckets,
  getTotals,
  getTrendByMonth,
  type KaiStatusFilters,
} from "../data/query";

/**
 * Dashboard metrics cached by React Query.
 * - Each query key includes filter flags so charts update when filters change
 * - staleTime: 5 minutes to avoid redundant recompute during short interactions
 */
export function useDashboardMetrics(filters: KaiStatusFilters) {
  const keySuffix = JSON.stringify({
    k1: filters.excludeKaiInvalid,
    k2: filters.excludeAiInvalid,
    sev: filters.severities,
    pq: filters.packageQuery,
    tq: filters.textQuery,
    df: filters.dateFrom,
    dt: filters.dateTo,
  });

  const totals = useQuery({
    queryKey: ["totals", keySuffix],
    queryFn: () => getTotals(filters),
    staleTime: 5 * 60 * 1000,
  });

  const severities = useQuery({
    queryKey: ["severityBuckets", keySuffix],
    queryFn: () => getSeverityBuckets(filters),
    staleTime: 5 * 60 * 1000,
  });

  const trend = useQuery({
    queryKey: ["trendByMonth", keySuffix],
    queryFn: () => getTrendByMonth(filters),
    staleTime: 5 * 60 * 1000,
  });

  return { totals, severities, trend };
}
