import { db } from "../data/db";
import { buildKaiPredicate, type KaiStatusFilters } from "../data/query";
import type { Vulnerability } from "../types/vuln";

/**
 * Simple file download helper
 */
function downloadBlob(content: Blob, filename: string) {
  const url = URL.createObjectURL(content);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

/**
 * Export current filtered result set to JSON.
 * Note: For extremely large results, consider streaming writers.
 */
export async function exportFilteredJSON(filters: KaiStatusFilters) {
  const pred = buildKaiPredicate(filters);
  const rows: Vulnerability[] = [];
  await db.vulnerabilities.filter(pred).each((v) => rows.push(v));
  const blob = new Blob([JSON.stringify(rows, null, 2)], {
    type: "application/json",
  });
  downloadBlob(blob, "vulnerabilities.json");
}

/**
 * Export current filtered result set to CSV (safe CSV quoting).
 */
export async function exportFilteredCSV(filters: KaiStatusFilters) {
  const pred = buildKaiPredicate(filters);
  const cols = [
    "cve",
    "severity",
    "cvss",
    "packageName",
    "packageVersion",
    "packageType",
    "published",
    "fixDate",
    "kaiStatus",
    "link",
  ];
  const header = cols.join(",");
  const out: string[] = [header];

  const esc = (val: unknown) => {
    const s = (val ?? "").toString();
    if (s.includes('"') || s.includes(",") || s.includes("\n")) {
      return `"${s.replace(/"/g, '""')}"`;
    }
    return s;
  };

  await db.vulnerabilities.filter(pred).each((v) => {
    const row = [
      v.cve,
      v.severity,
      v.cvss,
      v.packageName,
      v.packageVersion,
      v.packageType,
      v.published,
      v.fixDate,
      v.kaiStatus,
      v.link,
    ]
      .map(esc)
      .join(",");
    out.push(row);
  });

  const blob = new Blob([out.join("\n")], { type: "text/csv;charset=utf-8" });
  downloadBlob(blob, "vulnerabilities.csv");
}
