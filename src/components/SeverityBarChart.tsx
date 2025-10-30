import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Cell,
} from "recharts";
import type { SeverityBucket } from "../data/query";
import { Box, Typography } from "@mui/material";

const ORDER = ["critical", "high", "medium", "low", "unknown"];
const COLORS: Record<string, string> = {
  critical: "#d32f2f",
  high: "#ef5350",
  medium: "#ffb300",
  low: "#2e7d32",
  unknown: "#757575",
};

export default function SeverityBarChart({ data }: { data: SeverityBucket[] }) {
  if (!data || data.length === 0) {
    return (
      <Typography variant="body2" color="text.secondary">
        No data
      </Typography>
    );
  }
  const sorted = [...data].sort(
    (a, b) => ORDER.indexOf(a.severity) - ORDER.indexOf(b.severity)
  );

  return (
    <Box sx={{ width: "100%", height: 260 }}>
      <ResponsiveContainer width="100%" height="100%">
        <BarChart
          data={sorted}
          margin={{ left: 8, right: 8, top: 8, bottom: 8 }}
        >
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="severity" tickFormatter={(s) => s.toUpperCase()} />
          <YAxis allowDecimals={false} />
          <Tooltip />
          <Bar dataKey="count">
            {sorted.map((entry, idx) => (
              <Cell
                key={`cell-${idx}`}
                fill={COLORS[entry.severity] || COLORS.unknown}
              />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </Box>
  );
}
