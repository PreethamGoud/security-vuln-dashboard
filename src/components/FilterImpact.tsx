import { Chip, Stack, Tooltip } from "@mui/material";
import { useFilters } from "../contexts/FiltersContext";
import { useDashboardMetrics } from "../hooks/useDashboardMetrics";

/**
 * Shows how many CVEs are hidden by the Analysis toggles.
 * Uses byKaiStatus tallies (unfiltered), then applies toggles to decide which to show.
 */
export default function FilterImpact() {
  const { filters } = useFilters();
  const { totals } = useDashboardMetrics(filters);

  const hiddenKai = filters.excludeKaiInvalid
    ? (totals.data?.byKaiStatus.invalidNoRisk ?? 0)
    : 0;
  const hiddenAI = filters.excludeAiInvalid
    ? (totals.data?.byKaiStatus.aiInvalidNoRisk ?? 0)
    : 0;

  if (!hiddenKai && !hiddenAI) return null;

  return (
    <Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap">
      {hiddenKai > 0 && (
        <Tooltip title='Count of CVEs with kaiStatus = "invalid - norisk" excluded by "Analysis"'>
          <Chip
            color="warning"
            size="small"
            label={`Hidden by Analysis: ${hiddenKai}`}
          />
        </Tooltip>
      )}
      {hiddenAI > 0 && (
        <Tooltip title='Count of CVEs with kaiStatus = "ai-invalid-norisk" excluded by "AI Analysis"'>
          <Chip
            color="secondary"
            size="small"
            label={`Hidden by AI Analysis: ${hiddenAI}`}
          />
        </Tooltip>
      )}
    </Stack>
  );
}
