import { useCallback, useMemo, useRef, useState } from "react";
import { db, setMeta } from "../data/db";
import type { Vulnerability } from "../types/vuln";

type LoaderStatus = "idle" | "loading" | "cancelling" | "done" | "error";

/**
 * Orchestrates streaming ingest:
 * - spawns the Worker
 * - batches inserts into IndexedDB (Dexie) for throughput
 * - exposes progress/throughput + cancel
 */
export function useVulnLoader() {
  const [status, setStatus] = useState<LoaderStatus>("idle");
  const [received, setReceived] = useState(0); // items seen from worker
  const [inserted, setInserted] = useState(0); // items flushed to DB
  const [error, setError] = useState<string | null>(null);
  const [startedAt, setStartedAt] = useState<number | null>(null);

  const workerRef = useRef<Worker | null>(null);
  const batchRef = useRef<Vulnerability[]>([]);
  const flushingRef = useRef<Promise<void> | null>(null);
  const cancelledRef = useRef(false);

  // Flush any pending batch to Dexie (bulkPut is much faster than per-item)
  const flush = useCallback(async () => {
    if (batchRef.current.length === 0) return;
    const batch = batchRef.current;
    batchRef.current = [];
    await db.vulnerabilities.bulkPut(batch);
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
   * chunkSize controls when we bulkPut — bigger = fewer writes, smaller = lower memory.
   */
  const loadFromUrl = useCallback(
    async (url: string, chunkSize = 1000) => {
      if (status === "loading") return;

      cancelledRef.current = false;
      setError(null);
      setStatus("loading");
      setReceived(0);
      setInserted(0);
      setStartedAt(Date.now());

      // Clean slate for a fresh ingest
      if (workerRef.current) {
        workerRef.current.terminate();
        workerRef.current = null;
      }
      await db.vulnerabilities.clear();

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
          // Accumulate into a memory batch
          const vuln: Vulnerability = msg.item;
          batchRef.current.push(vuln);
          setReceived((prev) => prev + 1);

          // Backpressure: bulk flush when the batch reaches chunkSize
          if (batchRef.current.length >= chunkSize && !flushingRef.current) {
            const toFlush = [...batchRef.current];
            batchRef.current = [];
            flushingRef.current = db.vulnerabilities
              .bulkPut(toFlush)
              .then(() => {
                setInserted((prev) => prev + toFlush.length);
              })
              .finally(() => {
                flushingRef.current = null;
              });
          }
        } else if (msg.type === "done") {
          try {
            if (flushingRef.current) await flushingRef.current;
            await flush();
            await setMeta("sourceUrl", url);
            await setMeta("ingestedAt", new Date().toISOString());
            if (!cancelledRef.current) setStatus("done");
          } catch (err: any) {
            setError(err?.message || "Failed to finalize ingest");
            setStatus("error");
          } finally {
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
    return Date.now() - startedAt;
  }, [startedAt, inserted, received, status]);

  return {
    status,
    received,
    inserted,
    elapsedMs,
    error,
    loadFromUrl,
    cancel,
  };
}
