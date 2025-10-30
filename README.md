# Security Vulnerability Dashboard (React + TS + Vite)

Client‑only dashboard for exploring very large vulnerability reports (300MB+ JSON) with:

- Streaming JSON ingest in a Web Worker (no full-file memory spike)
- IndexedDB (Dexie) caching with batched writes
- Virtualized list for smooth scrolling across hundreds of thousands of rows
- Filters (Analysis/AI Analysis + severity, package, keyword, date range)
- Query‑backed metrics & charts (severity distribution, monthly trend)
- One‑click export (CSV/JSON) for the current filtered view

## Tech stack

- React + TypeScript + Vite
- Material UI v6 (Grid v2 via `@mui/material/Grid2`)
- React Router
- React Query (metrics caching)
- Dexie (IndexedDB)
- oboe (streaming JSON parser)
- @tanstack/react-virtual (virtualized lists)
- Recharts (charts)
- Web Worker (for streaming/parse off main thread)

## Quick start

```bash
# Node 18+ recommended (20+ preferred)
npm create vite@latest security-vuln-dashboard -- --template react-ts
cd security-vuln-dashboard

# Install dependencies
npm i react-router-dom @mui/material @mui/icons-material @emotion/react @emotion/styled \
  @tanstack/react-query @tanstack/react-virtual recharts dexie oboe

# Dev helpers (optional)
npm i -D eslint prettier @types/node

# Start
npm run dev
```

Place your large JSON at:

- Development: `public/ui.json` (recommended to avoid CORS)
- Then use URL `/ui.json` in the Dashboard loader

Note: The dataset file is already ignored by git. Keep big JSON out of version control.

## How it works (architecture)

- Worker (src/workers/jsonWorker.ts)
  - Uses oboe to stream nodes that match deep path: `!.groups.*.repos.*.images.*.vulnerabilities.*`
  - Emits each vulnerability as it arrives
  - Runs off the main thread to keep the UI responsive
  - Note: we alias `window` to `globalThis` before importing oboe to satisfy its UMD check

- Loader hook (src/hooks/useVulnLoader.ts)
  - Spawns the Worker and listens for streamed items
  - Batches inserts into IndexedDB via Dexie `bulkPut` for throughput
  - Tracks progress (received/inserted), supports Cancel, and writes basic metadata (sourceUrl, ingestedAt)

- Storage (src/data/db.ts)
  - Dexie DB with table `vulnerabilities` (`&cve, severity, packageName, kaiStatus, published` indexes)
  - `meta` KV table for ingest metadata

- Query layer (src/data/query.ts)
  - Builds a predicate from current filters (kaiStatus, severity, package substring, text match, date range)
  - Paged fetching ordered by `published` index (ascending/descending)
  - Aggregations for dashboard (totals, severity buckets, monthly trend)

- Virtualized list (src/hooks/useVirtualVulns.ts + @tanstack/react-virtual)
  - Keeps a small in-memory page cache
  - Invalidates cache whenever any filter or sort changes
  - Rows are fetched lazily as you scroll

- UI
  - Dashboard: filters + KPI chips + charts + ingest panel
  - Vulnerabilities: filter toolbar + advanced filters + export + virtualized list
  - Filters live in `FiltersContext` and are shared across pages

## Features

- Streaming ingest (Worker + oboe)
- IndexedDB cache (Dexie) with batched writes
- Analysis toggles:
  - Analysis: excludes `kaiStatus = "invalid - norisk"`
  - AI Analysis: excludes `kaiStatus = "ai-invalid-norisk"`
- Advanced filters:
  - Severity multi-select: critical, high, medium, low, unknown
  - Package substring match
  - Free text search (CVE, description, package)
  - Published date range (from/to, inclusive)
- Virtualized list with lazy page loading (fast even for very large sets)
- Charts (Recharts):
  - Severity distribution bar chart
  - Monthly published trend area chart
- Export CSV/JSON for the current filtered set

## Usage

1. Ingest data

- Go to Dashboard → “Load Vulnerability JSON” → enter `/ui.json` or a CORS‑enabled URL → Load
- Progress displays items/sec and DB counters
- Cancel stops streaming and flushes any pending inserts
- Clear Cache wipes DB and meta

2. Explore

- Use Analysis / AI Analysis toggles at the top (FilterBar)
- Open Vulnerabilities → apply Advanced Filters (severity, package, text, dates)
- Scroll the virtualized list; rows are fetched as needed

3. Export

- Vulnerabilities → Export CSV / Export JSON
- Exports include only records matching current filters

## Troubleshooting

- “window is not defined” in Worker
  - Fixed by aliasing `window` to `globalThis` before dynamic `import('oboe')` in `jsonWorker.ts`

- MUI Grid type errors (xs/md props)
  - Use Grid v2: `import Grid2 from '@mui/material/Grid2'` and `<Grid2 xs={12} md={6}>`
  - Do not mix with v1 `<Grid item>` API

- TypeScript “verbatimModuleSyntax” with Dexie
  - Import Dexie types with type-only syntax: `import Dexie, { type Table } from 'dexie';`

- CORS on remote JSON
  - Prefer placing files in `public/` during development
  - If using raw GitHub, ensure proper CORS headers

## Project structure (high-level)

```
src/
  components/
    AdvancedFilters.tsx
    FilterBar.tsx
    SeverityBarChart.tsx
    TrendAreaChart.tsx
    VulnRow.tsx
    AppLayout.tsx
  contexts/
    FiltersContext.tsx
  data/
    db.ts
    query.ts
  hooks/
    useDashboardMetrics.ts
    useVirtualVulns.ts
    useVulnLoader.ts
  pages/
    Dashboard.tsx
    Vulnerabilities.tsx
    About.tsx
  types/
    oboe.d.ts
    vuln.ts
  workers/
    jsonWorker.ts
```

## Notes on performance

- Worker streaming ensures we never allocate the full JSON
- `bulkPut` reduces transaction overhead
- Indexed `published` field enables fast ordered paging
- `@tanstack/react-virtual` renders only visible rows
- React Query caches dashboard aggregations per filter state

## Roadmap

- Detail view with CVE enrichment
- Saved filter presets
- Pre-aggregations for sub-second charts on very large sets
- Streaming/worker‑based export for extremely large outputs
- Comparison view and “critical after filtering” highlight

## License

MIT
