import { db } from "./db";
import type { Vulnerability } from "../types/vuln";

export type SortKey = "published-desc" | "published-asc";

export type KaiStatusFilters = {
  excludeKaiInvalid: boolean;
  excludeAiInvalid: boolean;
  severities: string[];
  packageQuery: string;
  textQuery: string;
  dateFrom?: string;
  dateTo?: string;
};

function inDateRange(pub?: string, from?: string, to?: string) {
  // If date filters are used, items without a valid date are excluded.
  if (!pub) return false;
  const t = new Date(pub).getTime();
  if (isNaN(t)) return false;
  if (from) {
    const f = new Date(from).getTime();
    if (!isNaN(f) && t < f) return false;
  }
  if (to) {
    // Inclusive upper bound: end of "to" day
    const end = new Date(to);
    end.setHours(23, 59, 59, 999);
    const tt = end.getTime();
    if (!isNaN(tt) && t > tt) return false;
  }
  return true;
}

/**
 * Build a composable predicate covering:
 * - kaiStatus exclusions
 * - severity whitelist
 * - package substring match
 * - text query (cve/description/packageName)
 * - published date range
 */
export function buildKaiPredicate(filters: KaiStatusFilters) {
  const invalid = "invalid - norisk";
  const aiInvalid = "ai-invalid-norisk";
  const sevSet = new Set(filters.severities.map((s) => s.toLowerCase()));
  const pQuery = filters.packageQuery.trim().toLowerCase();
  const tQuery = filters.textQuery.trim().toLowerCase();

  return (v: Vulnerability) => {
    const ks = (v.kaiStatus || "").toLowerCase();
    if (filters.excludeKaiInvalid && ks === invalid) return false;
    if (filters.excludeAiInvalid && ks === aiInvalid) return false;

    if (sevSet.size) {
      const sev = (v.severity || "unknown").toLowerCase();
      if (!sevSet.has(sev)) return false;
    }

    if (pQuery) {
      const pkg = (v.packageName || "").toLowerCase();
      if (!pkg.includes(pQuery)) return false;
    }

    if (tQuery) {
      const hay =
        `${v.cve || ""} ${v.description || ""} ${v.packageName || ""}`.toLowerCase();
      if (!hay.includes(tQuery)) return false;
    }

    if (filters.dateFrom || filters.dateTo) {
      if (!inDateRange(v.published, filters.dateFrom, filters.dateTo))
        return false;
    }

    return true;
  };
}

export async function getTotalCount(
  filters: KaiStatusFilters
): Promise<number> {
  const pred = buildKaiPredicate(filters);
  return db.vulnerabilities.filter(pred).count();
}

/**
 * Page retrieval using the `published` index.
 * - Keeping sort to an indexed key avoids scanning/sorting full table in memory.
 */
export async function getPage(
  filters: KaiStatusFilters,
  sort: SortKey,
  offset: number,
  limit: number
): Promise<Vulnerability[]> {
  const pred = buildKaiPredicate(filters);
  let coll = db.vulnerabilities.orderBy("published");
  if (sort === "published-desc") coll = coll.reverse();
  return coll.filter(pred).offset(offset).limit(limit).toArray();
}

export type SeverityBucket = { severity: string; count: number };

export async function getSeverityBuckets(
  filters: KaiStatusFilters
): Promise<SeverityBucket[]> {
  const pred = buildKaiPredicate(filters);
  const buckets = new Map<string, number>();
  await db.vulnerabilities.filter(pred).each((v) => {
    const s = (v.severity || "unknown").toLowerCase();
    buckets.set(s, (buckets.get(s) || 0) + 1);
  });
  return Array.from(buckets.entries()).map(([severity, count]) => ({
    severity,
    count,
  }));
}

export type Totals = {
  total: number; // respecting current filters
  byKaiStatus: {
    valid: number;
    invalidNoRisk: number;
    aiInvalidNoRisk: number;
    other: number;
  };
};

export async function getTotals(filters: KaiStatusFilters): Promise<Totals> {
  const pred = buildKaiPredicate(filters);

  let total = 0;
  let invalidNoRisk = 0;
  let aiInvalidNoRisk = 0;
  let other = 0;
  let valid = 0;

  await db.vulnerabilities.each((v) => {
    // Aggregate overall kaiStatus composition (not filtered)
    const ks = (v.kaiStatus || "").toLowerCase();
    if (ks === "invalid - norisk") invalidNoRisk++;
    else if (ks === "ai-invalid-norisk") aiInvalidNoRisk++;
    else if (ks) other++;
    else valid++;

    // Count total under current filter view
    if (pred(v)) total++;
  });

  return {
    total,
    byKaiStatus: { valid, invalidNoRisk, aiInvalidNoRisk, other },
  };
}

export type TrendPoint = { month: string; count: number };

export async function getTrendByMonth(
  filters: KaiStatusFilters
): Promise<TrendPoint[]> {
  const pred = buildKaiPredicate(filters);
  const map = new Map<string, number>();

  await db.vulnerabilities.filter(pred).each((v) => {
    if (!v.published) return;
    const d = new Date(v.published);
    if (isNaN(d.getTime())) return;
    const key = `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, "0")}`;
    map.set(key, (map.get(key) || 0) + 1);
  });

  return Array.from(map.entries())
    .sort(([a], [b]) => (a < b ? -1 : a > b ? 1 : 0))
    .map(([month, count]) => ({ month, count }));
}
