import Dexie, { type Table } from "dexie";
import type { Vulnerability } from "../types/vuln";

export interface MetaKV {
  key: string;
  value: unknown;
}

/**
 * Dexie database
 * - Primary table: vulnerabilities (keyed by cve)
 * - Secondary indexes: severity, packageName, kaiStatus, published
 *   These speed up ordered/filtered queries without full scans.
 */
export class VulnDB extends Dexie {
  vulnerabilities!: Table<Vulnerability, string>;
  meta!: Table<MetaKV, string>;

  constructor() {
    super("vuln-db");
    this.version(1).stores({
      vulnerabilities: "&cve, severity, packageName, kaiStatus, published",
      meta: "&key",
    });
  }
}

export const db = new VulnDB();

// Key-value metadata helpers (e.g., sourceUrl, ingestedAt)
export async function setMeta(key: string, value: unknown) {
  await db.meta.put({ key, value });
}

export async function getMeta<T>(key: string): Promise<T | undefined> {
  const row = await db.meta.get(key);
  return row?.value as T | undefined;
}

// Nuke all data (used by "Clear Cache")
export async function clearAll() {
  await db.transaction("readwrite", db.vulnerabilities, db.meta, async () => {
    await db.vulnerabilities.clear();
    await db.meta.clear();
  });
}
