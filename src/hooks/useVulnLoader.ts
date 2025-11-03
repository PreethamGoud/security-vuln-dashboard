import { useCallback, useMemo, useRef, useState } from "react";
import { enableFastWrite, enableIndexedRead, setMeta } from "../data/db";
import type { Vulnerability } from "../types/vuln";
import type Dexie from "dexie";

type LoaderStatus = "idle" | "loading" | "cancelling" | "done" | "error";

/**
 * Orchestrates streaming ingest:
 * - spawns the Worker
 * - batches inserts into IndexedDB (Dexie) for throughput
 * - exposes progress/throughput + cancel
 */
export function useVulnLoader() {
  const [status, setStatus] = useState<LoaderStatus>("idle");
  const [received, setReceived] = useState(0); // unique items seen from worker
  const [skipped, setSkipped] = useState(0); // duplicates skipped
  const [inserted, setInserted] = useState(0); // items flushed to DB
  const [error, setError] = useState<string | null>(null);
  const [startedAt, setStartedAt] = useState<number | null>(null);
  const [completedAt, setCompletedAt] = useState<number | null>(null);

  const workerRef = useRef<Worker | null>(null);
  const batchRef = useRef<Vulnerability[]>([]);
  const fastDbRef = useRef<Dexie | null>(null);
  const flushingRef = useRef<Promise<void> | null>(null);
  const cancelledRef = useRef(false);

  // Flush any pending batch to Dexie (bulkPut is much faster than per-item)
  const flush = useCallback(async () => {
    if (batchRef.current.length === 0) return;
    const batch = batchRef.current;
    batchRef.current = [];
    const db = fastDbRef.current;
    if (!db) return;
    await db.table("vulnerabilities").bulkPut(batch);
    setInserted((prev) => prev + batch.length);
  }, []);

  // Gracefully stop worker and finish pending writes
  const teardown = useCallback(async () => {
    if (flushingRef.current) {
      try {
        await flushingRef.current;
      } catch {
        /* noop */
      }
    }
    await flush();
    if (workerRef.current) {
      workerRef.current.terminate();
      workerRef.current = null;
    }
  }, [flush]);

  const cancel = useCallback(async () => {
    if (!workerRef.current) return;
    cancelledRef.current = true;
    setStatus("cancelling");
    try {
      workerRef.current.postMessage({ type: "cancel" });
    } finally {
      await teardown();
      setStatus("idle");
    }
  }, [teardown]);

  /**
   * Start streaming from URL.
   * Strategy: Write with minimal indexes, add indexes at end.
   */
  const loadFromUrl = useCallback(
    async (url: string, chunkSize = 10000) => {
      if (status === "loading") return;

      cancelledRef.current = false;
      setError(null);
      setStatus("loading");
      setReceived(0);
      setSkipped(0);
      setInserted(0);
      setStartedAt(Date.now());
      setCompletedAt(null);

      // Clean slate for a fresh ingest
      if (workerRef.current) {
        workerRef.current.terminate();
        workerRef.current = null;
      }

      // Create fast-write DB (no secondary indexes)
      const fastDb = await enableFastWrite();
      fastDbRef.current = fastDb;

      const worker = new Worker(
        new URL("../workers/jsonWorker.ts", import.meta.url),
        {
          type: "module",
        }
      );
      workerRef.current = worker;

      worker.onmessage = async (e: MessageEvent) => {
        const msg = e.data;

        if (msg.type === "item") {
          // Handle both single items and batches
          const items: Vulnerability[] = Array.isArray(msg.item)
            ? msg.item
            : [msg.item];

          // Accumulate in batch
          batchRef.current.push(...items);
          setReceived((prev) => prev + items.length);

          // For small unique datasets (<10K), accumulate all then write once
          // For larger datasets, flush in chunks
          if (batchRef.current.length >= chunkSize) {
            const toFlush = [...batchRef.current];
            batchRef.current = [];

            fastDb
              .table("vulnerabilities")
              .bulkPut(toFlush)
              .then(() => {
                setInserted((prev) => prev + toFlush.length);
              })
              .catch((err) => {
                console.error("Bulk put error:", err);
              });
          }
        } else if (msg.type === "progress") {
          // Update skip counter from worker
          if (msg.skipped !== undefined) {
            setSkipped(msg.skipped);
          }
        } else if (msg.type === "done") {
          try {
            // Update final skip count
            if (msg.skipped !== undefined) {
              setSkipped(msg.skipped);
            }

            // Flush remaining batch
            if (batchRef.current.length > 0) {
              await flush();
            }

            // Close fast DB
            fastDb.close();

            // Upgrade to indexed schema (this reopens the DB with indexes)
            const indexedDb = await enableIndexedRead();

            // Save metadata using the indexed DB instance
            await indexedDb.table("meta").put({ key: "sourceUrl", value: url });
            await indexedDb.table("meta").put({
              key: "ingestedAt",
              value: new Date().toISOString(),
            });

            indexedDb.close();

            if (!cancelledRef.current) {
              setCompletedAt(Date.now());
              setStatus("done");
            }
          } catch (err: any) {
            console.error("Finalize error:", err);
            setError(err?.message || "Failed to finalize ingest");
            setStatus("error");
          } finally {
            fastDbRef.current = null;
            workerRef.current?.terminate();
            workerRef.current = null;
          }
        } else if (msg.type === "error") {
          setError(String(msg.error ?? "Unknown error"));
          setStatus("error");
          workerRef.current?.terminate();
          workerRef.current = null;
        }
      };

      worker.onerror = (ev) => {
        setError(ev.message || "Worker error");
        setStatus("error");
        workerRef.current?.terminate();
        workerRef.current = null;
      };

      worker.postMessage({ type: "load", url });
    },
    [flush, status]
  );

  // Live throughput helper
  const elapsedMs = useMemo(() => {
    if (!startedAt) return 0;
    const endTime = completedAt || Date.now();
    return endTime - startedAt;
  }, [startedAt, completedAt, inserted, received, status]);

  return {
    status,
    received,
    skipped,
    inserted,
    elapsedMs,
    completedAt,
    error,
    loadFromUrl,
    cancel,
  };
}
