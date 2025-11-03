import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          "vendor-react": ["react", "react-dom", "react-router-dom"],
          "vendor-mui": [
            "@mui/material",
            "@mui/icons-material",
            "@emotion/react",
            "@emotion/styled",
          ],
          "vendor-charts": ["recharts"],
          "vendor-query": ["@tanstack/react-query", "@tanstack/react-virtual"],
          "vendor-db": ["dexie", "oboe"],
        },
      },
    },
    chunkSizeWarningLimit: 1000,
  },
  worker: {
    format: "es",
  },
});
