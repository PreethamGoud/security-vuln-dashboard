# Security Vulnerability Dashboard (React + TS + Vite)

This app visualizes security vulnerabilities from a very large JSON file (300MB+).  
Client-only solution: no server-side API.

## Stack

- React + TypeScript + Vite
- Material UI (UI)
- React Router (navigation)
- React Query (async data management)
- Recharts (charts)
- Dexie (IndexedDB caching)
- oboe (streaming JSON parsing in the browser)
- Comlink (Web Worker communication)
- @tanstack/react-virtual (virtualized lists)

## Get started

```bash
# Node 18+ recommended (20+ preferred)
npm create vite@latest security-vuln-dashboard -- --template react-ts
cd security-vuln-dashboard

# Dependencies
npm i react-router-dom @mui/material @mui/icons-material @emotion/react @emotion/styled @tanstack/react-query @tanstack/react-virtual recharts dexie oboe comlink

# Dev tooling (optional)
npm i -D eslint prettier @types/node

# Run
npm run dev
```

Open http://localhost:5173

## Next steps (guided)

1. Data loading strategy for 300MB+ JSON (streaming + Web Worker + IndexedDB cache).
2. Define data model/types and flattening utilities (extract vulnerabilities array from nested structure).
3. Implement virtualization, filters (including `kaiStatus` logic), and charts.
4. Add "Analysis" and "AI Analysis" buttons that toggle the `kaiStatus` filters.
5. Comparison, export, user preferences, and advanced visualizations.
