import { Routes, Route, Navigate } from "react-router-dom";
import AppLayout from "./components/AppLayout";
import Dashboard from "./pages/Dashboard";
import Vulnerabilities from "./pages/Vulnerabilities";
import About from "./pages/About";
import { FiltersProvider } from "./contexts/FiltersContext";

export default function App() {
  return (
    <FiltersProvider>
      <AppLayout>
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/vulns" element={<Vulnerabilities />} />
          <Route path="/about" element={<About />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </AppLayout>
    </FiltersProvider>
  );
}
