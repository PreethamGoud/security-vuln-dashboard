export type RiskFactors = Record<string, unknown>;

/**
 * Flattened vulnerability model we persist in IndexedDB.
 * Only fields required for UI/filters/metrics are included here.
 */
export interface Vulnerability {
  cve: string; // Unique ID
  severity?: string; // critical|high|medium|low|unknown
  cvss?: number; // numeric score
  description?: string; // details for detail row
  packageName?: string; // vulnerable dependency
  packageVersion?: string;
  packageType?: string;
  link?: string; // NVD URL or advisory
  published?: string; // ISO string, used for trend + sort
  fixDate?: string; // ISO string (if available)
  kaiStatus?: string; // "invalid - norisk" | "ai-invalid-norisk" | ...
  riskFactors?: RiskFactors;

  // Optional enrichment placeholders (if you later want to include provenance)
  groupId?: string;
  repo?: string;
  imageTag?: string;
}
