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
  | { type: "progress"; items: number } // periodic progress (throttled)
  | { type: "done"; items: number } // stream completed
  | { type: "error"; error: string }; // stream failed

let currentRequest: any | null = null;
let seen = 0;

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
    return;
  }

  if (data.type === "load") {
    const { url } = data;
    seen = 0;

    try {
      const oboe = await loadOboe();

      /**
       * Path selector notes:
       *  - Our JSON structure is deep: root.groups.*.repos.*.images.*.vulnerabilities.*
       *  - The selector below matches every element in any `vulnerabilities` array under that path
       *  - `oboe.drop` tells oboe not to retain matched nodes (reduces memory)
       */
      currentRequest = oboe({ url, cached: false })
        .node("!.groups.*.repos.*.images.*.vulnerabilities.*", (vuln: any) => {
          seen++;
          post({ type: "item", item: vuln });

          // Throttle progress messages to avoid flooding postMessage
          if (seen % 500 === 0) {
            post({ type: "progress", items: seen });
          }

          return oboe.drop;
        })
        .done(() => {
          post({ type: "done", items: seen });
          currentRequest = null;
        })
        .fail((err: any) => {
          post({
            type: "error",
            error:
              (err &&
                (err.thrown ||
                  err.jsonBody ||
                  err.statusCode ||
                  err.toString?.())) ||
              "Unknown error",
          });
          currentRequest = null;
        });
    } catch (err: any) {
      post({ type: "error", error: err?.message || "Worker failed to start" });
      currentRequest = null;
    }
  }
};
