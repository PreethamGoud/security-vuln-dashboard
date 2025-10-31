import { Box, Chip, Link, Stack, Typography, Checkbox } from "@mui/material";
import type { Vulnerability } from "../types/vuln";
import { useSelection } from "../contexts/SelectionContext";

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

export default function VulnRow({ v }: { v: Vulnerability }) {
  const { selected, toggle } = useSelection();
  const isSelected = selected.includes(v.cve);

  return (
    <Stack
      direction="row"
      spacing={2}
      alignItems="center"
      sx={{
        px: 2,
        py: 1.25,
        bgcolor: isSelected ? "action.hover" : "transparent",
      }}
    >
      <Checkbox
        size="small"
        checked={isSelected}
        onChange={() => toggle(v.cve)}
      />
      <Box sx={{ minWidth: 180 }}>
        <Typography variant="body2" sx={{ fontWeight: 600 }}>
          {v.cve}
        </Typography>
        <Typography variant="caption" color="text.secondary">
          {v.packageName ?? "-"}
        </Typography>
      </Box>

      <Chip
        size="small"
        color={severityColor(v.severity) as any}
        label={(v.severity || "unknown").toUpperCase()}
        sx={{ minWidth: 84 }}
        variant="outlined"
      />

      <Box sx={{ flex: 1, minWidth: 200 }}>
        <Typography variant="body2" noWrap title={v.description}>
          {v.description || "-"}
        </Typography>
        <Stack direction="row" spacing={1} alignItems="center">
          {v.kaiStatus && (
            <Chip
              size="small"
              variant="outlined"
              color="info"
              label={`kai: ${v.kaiStatus}`}
            />
          )}
          {v.cvss != null && <Chip size="small" label={`CVSS ${v.cvss}`} />}
        </Stack>
      </Box>

      <Box sx={{ minWidth: 150, textAlign: "right" }}>
        {v.link ? (
          <Link href={v.link} target="_blank" rel="noreferrer" variant="body2">
            NVD
          </Link>
        ) : (
          <Typography variant="body2" color="text.secondary">
            —
          </Typography>
        )}
        <Typography variant="caption" color="text.secondary">
          {v.published ?? ""}
        </Typography>
      </Box>
    </Stack>
  );
}
