import { useEffect, useMemo, useState } from "react";
import {
  Box,
  Paper,
  Typography,
  Stack,
  TextField,
  Button,
  LinearProgress,
  Alert,
  Grid,
  Chip,
  Divider,
  Skeleton,
} from "@mui/material";
import { db, clearAll } from "../data/db";
import { useVulnLoader } from "../hooks/useVulnLoader";
import { useFilters } from "../contexts/FiltersContext";
import FilterBar from "../components/FilterBar";
import { useDashboardMetrics } from "../hooks/useDashboardMetrics";
import SeverityBarChart from "../components/SeverityBarChart";
import TrendAreaChart from "../components/TrendAreaChart";

export default function Dashboard() {
  const [url, setUrl] = useState("/ui.json");
  const { status, received, inserted, elapsedMs, error, loadFromUrl, cancel } =
    useVulnLoader();

  const canLoad = status === "idle" || status === "done" || status === "error";
  const canCancel = status === "loading";

  // Live throughput text
  const eta = useMemo(() => {
    if (received < 1 || elapsedMs < 1000) return "";
    const perSec = received / (elapsedMs / 1000);
    return `${perSec.toFixed(0)} items/sec`;
  }, [received, elapsedMs]);

  // Show existing DB count
  const [existingCount, setExistingCount] = useState<number>(0);
  useEffect(() => {
    let alive = true;
    db.vulnerabilities.count().then((c) => alive && setExistingCount(c));
    return () => {
      alive = false;
    };
  }, [status, inserted]);

  const { filters } = useFilters();
  const { totals, severities, trend } = useDashboardMetrics(filters);

  return (
    <Box>
      <Typography variant="h5" gutterBottom>
        Dashboard
      </Typography>

      {/* Filter chips + KPIs */}
      <Paper sx={{ p: 2, mb: 2 }}>
        <Stack
          direction={{ xs: "column", md: "row" }}
          spacing={2}
          alignItems={{ xs: "stretch", md: "center" }}
          justifyContent="space-between"
        >
          <FilterBar />
          <Stack
            direction="row"
            spacing={2}
            alignItems="center"
            flexWrap="wrap"
          >
            {totals.isLoading ? (
              <Skeleton variant="rounded" width={160} height={36} />
            ) : (
              <Chip
                color="primary"
                label={`Total (filtered): ${totals.data?.total ?? 0}`}
              />
            )}
            {severities.isLoading ? (
              <Skeleton variant="rounded" width={180} height={36} />
            ) : (
              <Chip
                color="default"
                label={`Severity buckets: ${(severities.data ?? []).reduce((a, b) => a + b.count, 0)}`}
              />
            )}
          </Stack>
        </Stack>
      </Paper>

      {/* Charts (bar + area) */}
      <Grid container spacing={2} sx={{ mb: 2 }}>
        <Grid size={{ xs: 12, md: 6 }}>
          <Paper sx={{ p: 2, height: "100%" }}>
            <Typography variant="subtitle1" gutterBottom>
              Severity Distribution
            </Typography>
            {severities.isLoading ? (
              <Skeleton variant="rectangular" height={220} />
            ) : (
              <SeverityBarChart data={severities.data ?? []} />
            )}
          </Paper>
        </Grid>
        <Grid size={{ xs: 12, md: 6 }}>
          <Paper sx={{ p: 2, height: "100%" }}>
            <Typography variant="subtitle1" gutterBottom>
              Monthly Trend (Published)
            </Typography>
            {trend.isLoading ? (
              <Skeleton variant="rectangular" height={220} />
            ) : (
              <TrendAreaChart data={trend.data ?? []} />
            )}
          </Paper>
        </Grid>
      </Grid>

      <Divider sx={{ my: 2 }} />

      {/* Loader panel */}
      <Paper sx={{ p: 3, mb: 3 }}>
        <Typography variant="h6" gutterBottom>
          Load Vulnerability JSON (Client-Only, Streaming)
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          Recommended: put the file at <code>public/ui.json</code> and use URL{" "}
          <code>/ui.json</code>. For remote URLs, ensure CORS is allowed (e.g.,
          a GitHub raw link may require CORS).
        </Typography>

        <Stack
          direction={{ xs: "column", sm: "row" }}
          spacing={2}
          alignItems="center"
        >
          <TextField
            fullWidth
            label="JSON URL"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="/ui.json"
          />
          <Button
            variant="contained"
            onClick={() => loadFromUrl(url)}
            disabled={!canLoad || !url}
          >
            {status === "loading" ? "Loading…" : "Load JSON"}
          </Button>
          <Button
            variant="outlined"
            color="warning"
            onClick={cancel}
            disabled={!canCancel}
          >
            Cancel
          </Button>
          <Button
            variant="outlined"
            color="error"
            onClick={async () => {
              await clearAll();
              setExistingCount(0);
            }}
            disabled={status === "loading"}
          >
            Clear Cache
          </Button>
        </Stack>

        <Box sx={{ mt: 2 }}>
          {status === "loading" && <LinearProgress />}
          <Stack direction="row" spacing={3} sx={{ mt: 1 }} flexWrap="wrap">
            <Typography variant="body2">Status: {status}</Typography>
            <Typography variant="body2">
              Received: {received.toLocaleString()}
            </Typography>
            <Typography variant="body2">
              Inserted: {inserted.toLocaleString()}
            </Typography>
            {eta && <Typography variant="body2">Throughput: {eta}</Typography>}
            <Typography variant="body2">
              Existing in DB: {existingCount.toLocaleString()}
            </Typography>
          </Stack>
          {error && (
            <Alert severity="error" sx={{ mt: 2 }}>
              {error}
            </Alert>
          )}
        </Box>
      </Paper>

      <Paper sx={{ p: 3 }}>
        <Typography variant="body1">
          Next, we’ll add search and advanced filters (severity, package, text
          search), and start export functionality for filtered results.
        </Typography>
      </Paper>
    </Box>
  );
}
