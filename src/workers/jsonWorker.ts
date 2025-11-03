/// <reference lib="webworker" />
/* eslint-disable no-restricted-globals */

/**
 * Streaming JSON parser worker
 *
 * Why a Worker?
 * - Keeps the main thread responsive while ingesting 300MB+ JSON
 * - Streams one vulnerability at a time: never materializes the whole JSON
 *
 * Why oboe?
 * - oboe can match deep JSON paths and emit nodes as they arrive
 *
 * Why alias `window`?
 * - oboe’s UMD build checks for a browser `window` global; Workers use `globalThis/self`.
 *   Creating a `window` alias before dynamic import avoids "window is not defined".
 */
async function loadOboe() {
  (globalThis as any).window = globalThis as any;
  const mod: any = await import("oboe");
  return mod?.default ?? mod;
}

type LoadMsg = { type: "load"; url: string };
type CancelMsg = { type: "cancel" };
type MsgIn = LoadMsg | CancelMsg;

type MsgOut =
  | { type: "item"; item: any } // a single vulnerability element
  | { type: "progress"; items: number; skipped: number } // periodic progress (throttled)
  | { type: "done"; items: number; skipped: number } // stream completed
  | { type: "error"; error: string }; // stream failed

let currentRequest: any | null = null;
let seen = 0;
let skipped = 0;
const seenCves = new Set<string>(); // Deduplication tracker

function post(out: MsgOut) {
  // @ts-ignore — web worker global
  postMessage(out);
}

onmessage = async (e: MessageEvent<MsgIn>) => {
  const data = e.data;

  if (data.type === "cancel") {
    // Attempt to abort the streaming HTTP request if still active
    if (currentRequest) {
      try {
        currentRequest.abort();
      } catch {
        /* noop */
      }
      currentRequest = null;
    }
    seenCves.clear();
    return;
  }

  if (data.type === "load") {
    const { url } = data;
    seen = 0;
    skipped = 0;
    seenCves.clear();

    try {
      // Fetch entire JSON file in one go (faster than streaming for dedup scenarios)
      post({ type: "progress", items: 0, skipped: 0 });

      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      // Read entire JSON into memory
      const text = await response.text();
      post({ type: "progress", items: 0, skipped: 0 }); // Downloaded

      // Parse JSON
      const jsonData = JSON.parse(text);
      post({ type: "progress", items: 0, skipped: 0 }); // Parsed

      // Extract all vulnerabilities from nested structure
      const allVulns: any[] = [];
      if (jsonData.groups) {
        for (const group of Object.values(jsonData.groups || {})) {
          const g = group as any;
          if (g.repos) {
            for (const repo of Object.values(g.repos || {})) {
              const r = repo as any;
              if (r.images) {
                for (const image of Object.values(r.images || {})) {
                  const img = image as any;
                  if (
                    img.vulnerabilities &&
                    Array.isArray(img.vulnerabilities)
                  ) {
                    allVulns.push(...img.vulnerabilities);
                  }
                }
              }
            }
          }
        }
      }

      post({ type: "progress", items: 0, skipped: allVulns.length });

      // Deduplicate in memory using Map (preserves first occurrence)
      const uniqueMap = new Map<string, any>();
      let dupCount = 0;

      for (const vuln of allVulns) {
        if (vuln.cve) {
          if (uniqueMap.has(vuln.cve)) {
            dupCount++;
          } else {
            uniqueMap.set(vuln.cve, vuln);
          }
        }
      }

      const uniqueVulns = Array.from(uniqueMap.values());
      seen = uniqueVulns.length;
      skipped = dupCount;

      post({ type: "progress", items: seen, skipped });

      // Send unique records in batches
      const BATCH_SIZE = 500;
      for (let i = 0; i < uniqueVulns.length; i += BATCH_SIZE) {
        const batch = uniqueVulns.slice(i, i + BATCH_SIZE);
        post({ type: "item", item: batch });
      }

      post({ type: "done", items: seen, skipped });
      currentRequest = null;
    } catch (err: any) {
      post({ type: "error", error: err?.message || "Worker failed to load" });
      currentRequest = null;
    }
  }
};
