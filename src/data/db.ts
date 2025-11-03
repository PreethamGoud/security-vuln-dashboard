import Dexie, { type Table } from "dexie";
import type { Vulnerability } from "../types/vuln";

export interface MetaKV {
  key: string;
  value: unknown;
}

/**
 * Dexie database
 * - Primary table: vulnerabilities (keyed by cve)
 * - Full indexes for fast querying (load time is optimized via deduplication)
 *   Version 1: With indexes (for querying)
 *   Version 2: Without indexes (for fast bulk loading)
 */
export class VulnDB extends Dexie {
  vulnerabilities!: Table<Vulnerability, string>;
  meta!: Table<MetaKV, string>;

  constructor() {
    super("vuln-db");
    this.version(1).stores({
      vulnerabilities:
        "&cve, severity, packageName, kaiStatus, published, [kaiStatus+severity]",
      meta: "&key",
    });
    // Version 2: Minimal schema for fast writes (only during bulk load)
    this.version(2).stores({
      vulnerabilities: "&cve",
      meta: "&key",
    });
  }
}

export const db = new VulnDB();

/**
 * Drop and recreate DB without indexes for fast bulk loading
 */
export async function enableFastWrite() {
  await db.close();
  await Dexie.delete("vuln-db");

  const fastDb = new Dexie("vuln-db");
  fastDb.version(1).stores({
    vulnerabilities: "&cve", // Primary key only
    meta: "&key",
  });
  await fastDb.open();
  return fastDb;
}

/**
 * Upgrade to full indexed schema for querying
 */
export async function enableIndexedRead() {
  // Reopen with full schema - Dexie will add all indexes
  const indexedDb = new VulnDB();
  indexedDb.version(3).stores({
    vulnerabilities:
      "&cve, severity, packageName, kaiStatus, published, [kaiStatus+severity]",
    meta: "&key",
  });
  await indexedDb.open();
  return indexedDb;
}

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
