import { useMemo, useRef } from "react";
import {
  Box,
  Paper,
  Stack,
  Typography,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Divider,
  Skeleton,
  Button,
} from "@mui/material";
import { useVirtualizer } from "@tanstack/react-virtual";
import FilterBar from "../components/FilterBar";
import AdvancedFilters from "../components/AdvancedFilters";
import { useFilters } from "../contexts/FiltersContext";
import { useVirtualVulns } from "../hooks/useVirtualVulns";
import type { SortKey } from "../data/query";
import VulnRow from "../components/VulnRow";
import { exportFilteredCSV, exportFilteredJSON } from "../utils/export";

/**
 * Virtualized listing wired to FiltersContext.
 * - ensureRow lazily populates the page that contains the visible row
 * - export uses the same predicate as the list/dashboard
 */
export default function Vulnerabilities() {
  const { filters } = useFilters();
  const [sort]: [SortKey] = useMemo(() => ["published-desc"], []);

  const parentRef = useRef<HTMLDivElement | null>(null);
  const { total, ensureRow, getRow } = useVirtualVulns({
    pageSize: 100,
    filters,
    sort,
  });

  const rowVirtualizer = useVirtualizer({
    count: total,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 64,
    overscan: 10,
  });

  return (
    <Box>
      <Typography variant="h5" gutterBottom>
        Vulnerabilities
      </Typography>

      <Paper sx={{ p: 2, mb: 2 }}>
        <Stack
          direction={{ xs: "column", md: "row" }}
          spacing={2}
          alignItems={{ xs: "stretch", md: "center" }}
          justifyContent="space-between"
        >
          <FilterBar />
          <FormControl size="small" sx={{ minWidth: 200 }}>
            <InputLabel id="sort-label">Sort</InputLabel>
            <Select labelId="sort-label" label="Sort" value={sort} readOnly>
              <MenuItem value="published-desc">Published (Newest)</MenuItem>
              <MenuItem value="published-asc">Published (Oldest)</MenuItem>
            </Select>
          </FormControl>
          <Stack direction="row" spacing={1}>
            <Button
              size="small"
              variant="outlined"
              onClick={() => exportFilteredCSV(filters)}
            >
              Export CSV
            </Button>
            <Button
              size="small"
              variant="outlined"
              onClick={() => exportFilteredJSON(filters)}
            >
              Export JSON
            </Button>
          </Stack>
        </Stack>

        <Divider sx={{ my: 2 }} />

        <AdvancedFilters />
      </Paper>

      <Paper ref={parentRef} sx={{ height: "70vh", overflow: "auto" }}>
        <Box
          sx={{
            height: `${rowVirtualizer.getTotalSize()}px`,
            position: "relative",
          }}
        >
          {rowVirtualizer.getVirtualItems().map((virtualRow) => {
            const index = virtualRow.index;
            void ensureRow(index); // opportunistic load
            const v = getRow(index);

            return (
              <Box
                key={virtualRow.key}
                sx={{
                  position: "absolute",
                  top: 0,
                  left: 0,
                  width: "100%",
                  transform: `translateY(${virtualRow.start}px)`,
                  borderBottom: "1px solid",
                  borderColor: "divider",
                }}
              >
                {v ? (
                  <VulnRow v={v} />
                ) : (
                  <Stack spacing={1} sx={{ px: 2, py: 1.5 }}>
                    <Skeleton variant="text" width="30%" />
                    <Skeleton variant="text" width="60%" />
                  </Stack>
                )}
              </Box>
            );
          })}
        </Box>
      </Paper>
    </Box>
  );
}
