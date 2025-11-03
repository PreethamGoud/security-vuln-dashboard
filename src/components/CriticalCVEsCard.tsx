import { useEffect, useState } from "react";
import {
  Paper,
  Typography,
  List,
  ListItem,
  ListItemText,
  Chip,
  Box,
  Skeleton,
  Stack,
  IconButton,
} from "@mui/material";
import WarningAmberIcon from "@mui/icons-material/WarningAmber";
import OpenInNewIcon from "@mui/icons-material/OpenInNew";
import { useNavigate } from "react-router-dom";
import type { Vulnerability } from "../types/vuln";
import { getTopAfterFilters, type KaiStatusFilters } from "../data/query";

type Props = {
  filters: KaiStatusFilters;
  limit?: number;
};

function severityColor(sev?: string) {
  switch ((sev || "").toLowerCase()) {
    case "critical":
      return "error";
    case "high":
      return "error";
    case "medium":
      return "warning";
    case "low":
      return "success";
    default:
      return "default";
  }
}

export default function CriticalCVEsCard({ filters, limit = 10 }: Props) {
  const [loading, setLoading] = useState(true);
  const [vulns, setVulns] = useState<Vulnerability[]>([]);
  const navigate = useNavigate();

  useEffect(() => {
    let alive = true;
    setLoading(true);
    (async () => {
      const data = await getTopAfterFilters(filters, limit);
      if (!alive) return;
      setVulns(data);
      setLoading(false);
    })();
    return () => {
      alive = false;
    };
  }, [filters, limit]);

  return (
    <Paper sx={{ p: 2 }}>
      <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 2 }}>
        <WarningAmberIcon color="error" />
        <Typography variant="subtitle1">
          Top {limit} Critical Vulnerabilities
        </Typography>
      </Stack>

      {loading ? (
        <Box>
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton
              key={i}
              variant="rectangular"
              height={60}
              sx={{ mb: 1 }}
            />
          ))}
        </Box>
      ) : vulns.length === 0 ? (
        <Typography variant="body2" color="text.secondary">
          No vulnerabilities match current filters
        </Typography>
      ) : (
        <List dense>
          {vulns.map((v, idx) => (
            <ListItem
              key={v.cve}
              sx={{
                border: "1px solid",
                borderColor: "divider",
                borderRadius: 1,
                mb: 1,
                bgcolor: idx === 0 ? "error.50" : "background.paper",
                cursor: "pointer",
                "&:hover": { bgcolor: "action.hover" },
              }}
              onClick={() => navigate(`/vulns/${v.cve}`)}
              secondaryAction={
                <IconButton
                  edge="end"
                  size="small"
                  onClick={(e) => {
                    e.stopPropagation();
                    navigate(`/vulns/${v.cve}`);
                  }}
                >
                  <OpenInNewIcon fontSize="small" />
                </IconButton>
              }
            >
              <ListItemText
                primary={
                  <Stack direction="row" spacing={1} alignItems="center">
                    <Typography variant="body2" fontWeight={600}>
                      {v.cve}
                    </Typography>
                    <Chip
                      size="small"
                      color={severityColor(v.severity) as any}
                      label={(v.severity || "unknown").toUpperCase()}
                      variant="outlined"
                    />
                    {v.cvss != null && (
                      <Chip size="small" label={`CVSS ${v.cvss}`} />
                    )}
                  </Stack>
                }
                secondary={
                  <Typography variant="caption" noWrap>
                    {v.packageName} • {v.description?.slice(0, 80)}
                    {(v.description?.length ?? 0) > 80 ? "..." : ""}
                  </Typography>
                }
              />
            </ListItem>
          ))}
        </List>
      )}
    </Paper>
  );
}
