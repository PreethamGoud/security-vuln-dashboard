import { Button, Chip, Stack, Tooltip } from "@mui/material";
import PsychologyIcon from "@mui/icons-material/Psychology";
import RuleIcon from "@mui/icons-material/Rule";
import RestartAltIcon from "@mui/icons-material/RestartAlt";
import { useFilters } from "../contexts/FiltersContext";

export default function FilterBar() {
  const { filters, setFilters, reset, activeFilterCount } = useFilters();

  return (
    <Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap">
      <Tooltip title='Exclude CVEs with kaiStatus = "invalid - norisk"'>
        <Button
          variant={filters.excludeKaiInvalid ? "contained" : "outlined"}
          color="primary"
          startIcon={<RuleIcon />}
          onClick={() =>
            setFilters((f) => ({
              ...f,
              excludeKaiInvalid: !f.excludeKaiInvalid,
            }))
          }
        >
          Analysis
        </Button>
      </Tooltip>
      <Tooltip title='Exclude CVEs with kaiStatus = "ai-invalid-norisk"'>
        <Button
          variant={filters.excludeAiInvalid ? "contained" : "outlined"}
          color="secondary"
          startIcon={<PsychologyIcon />}
          onClick={() =>
            setFilters((f) => ({ ...f, excludeAiInvalid: !f.excludeAiInvalid }))
          }
        >
          AI Analysis
        </Button>
      </Tooltip>
      <Tooltip title="Reset all filters">
        <Button variant="text" startIcon={<RestartAltIcon />} onClick={reset}>
          Reset
        </Button>
      </Tooltip>

      {activeFilterCount > 0 && (
        <Chip
          label={`${activeFilterCount} filter${activeFilterCount > 1 ? "s" : ""} active`}
          color="info"
          size="small"
          sx={{ ml: 1 }}
        />
      )}
    </Stack>
  );
}
