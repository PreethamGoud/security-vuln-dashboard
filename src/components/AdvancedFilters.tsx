import {
  Box,
  Stack,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Checkbox,
  ListItemText,
  OutlinedInput,
} from "@mui/material";
import { useFilters } from "../contexts/FiltersContext";

const ALL_SEVERITIES = ["critical", "high", "medium", "low", "unknown"];

/**
 * Advanced filters UI
 * - Mutates FiltersContext; list + dashboard react automatically
 */
export default function AdvancedFilters() {
  const { filters, setFilters } = useFilters();

  return (
    <Box>
      <Stack direction={{ xs: "column", md: "row" }} spacing={2}>
        <FormControl sx={{ minWidth: 220 }} size="small">
          <InputLabel id="sev-label">Severity</InputLabel>
          <Select
            labelId="sev-label"
            multiple
            value={filters.severities}
            onChange={(e) =>
              setFilters((f) => ({
                ...f,
                severities: e.target.value as string[],
              }))
            }
            input={<OutlinedInput label="Severity" />}
            renderValue={(selected) =>
              selected.map((s) => s.toUpperCase()).join(", ")
            }
          >
            {ALL_SEVERITIES.map((sev) => (
              <MenuItem key={sev} value={sev}>
                <Checkbox checked={filters.severities.indexOf(sev) > -1} />
                <ListItemText primary={sev.toUpperCase()} />
              </MenuItem>
            ))}
          </Select>
        </FormControl>

        <TextField
          size="small"
          label="Package contains"
          value={filters.packageQuery}
          onChange={(e) =>
            setFilters((f) => ({ ...f, packageQuery: e.target.value }))
          }
        />

        <TextField
          size="small"
          label="Search text"
          value={filters.textQuery}
          onChange={(e) =>
            setFilters((f) => ({ ...f, textQuery: e.target.value }))
          }
          placeholder="cve, description, package…"
          sx={{ flex: 1, minWidth: 240 }}
        />

        <TextField
          size="small"
          type="date"
          label="Published from"
          InputLabelProps={{ shrink: true }}
          value={filters.dateFrom || ""}
          onChange={(e) =>
            setFilters((f) => ({ ...f, dateFrom: e.target.value || undefined }))
          }
        />

        <TextField
          size="small"
          type="date"
          label="Published to"
          InputLabelProps={{ shrink: true }}
          value={filters.dateTo || ""}
          onChange={(e) =>
            setFilters((f) => ({ ...f, dateTo: e.target.value || undefined }))
          }
        />
      </Stack>
    </Box>
  );
}
