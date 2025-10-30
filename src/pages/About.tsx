import { Box, Paper, Typography, Link } from "@mui/material";

export default function About() {
  return (
    <Box>
      <Typography variant="h5" gutterBottom>
        About
      </Typography>
      <Paper sx={{ p: 3 }}>
        <Typography>
          React + TypeScript + Vite + Material UI + React Query + React Router.
        </Typography>
        <Typography sx={{ mt: 1 }}>
          Upcoming: IndexedDB (Dexie) caching, streaming JSON parsing (oboe),
          charts (Recharts), virtualization, Web Workers (Comlink).
        </Typography>
        <Typography sx={{ mt: 2 }}>
          Made for large 300MB+ JSON datasets with client-only processing.
        </Typography>
      </Paper>
    </Box>
  );
}
