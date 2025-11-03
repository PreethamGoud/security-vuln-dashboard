import { lazy, Suspense } from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import { Box, CircularProgress } from "@mui/material";
import AppLayout from "./components/AppLayout";
import { FiltersProvider } from "./contexts/FiltersContext";
import { PreferencesProvider } from "./contexts/PreferencesContext";

// Lazy load pages for code splitting
const Dashboard = lazy(() => import("./pages/Dashboard"));
const Vulnerabilities = lazy(() => import("./pages/Vulnerabilities"));
const About = lazy(() => import("./pages/About"));
const VulnerabilityDetail = lazy(() => import("./pages/VulnerabilityDetail"));
const Debug = lazy(() => import("./pages/Debug"));

// Loading fallback component
const LoadingFallback = () => (
  <Box
    sx={{
      display: "flex",
      justifyContent: "center",
      alignItems: "center",
      minHeight: "60vh",
    }}
  >
    <CircularProgress />
  </Box>
);

export default function App() {
  return (
    <PreferencesProvider>
      <FiltersProvider>
        <AppLayout>
          <Suspense fallback={<LoadingFallback />}>
            <Routes>
              <Route path="/" element={<Dashboard />} />
              <Route path="/vulns" element={<Vulnerabilities />} />
              <Route path="/vulns/:cve" element={<VulnerabilityDetail />} />
              <Route path="/about" element={<About />} />
              <Route path="/debug" element={<Debug />} />
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </Suspense>
        </AppLayout>
      </FiltersProvider>
    </PreferencesProvider>
  );
}
