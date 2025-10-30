import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from "recharts";
import type { TrendPoint } from "../data/query";
import { Box, Typography } from "@mui/material";

export default function TrendAreaChart({ data }: { data: TrendPoint[] }) {
  if (!data || data.length === 0) {
    return (
      <Typography variant="body2" color="text.secondary">
        No data
      </Typography>
    );
  }
  return (
    <Box sx={{ width: "100%", height: 260 }}>
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart
          data={data}
          margin={{ left: 8, right: 8, top: 8, bottom: 8 }}
        >
          <defs>
            <linearGradient id="trendFill" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#1976d2" stopOpacity={0.5} />
              <stop offset="95%" stopColor="#1976d2" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="month" />
          <YAxis allowDecimals={false} />
          <Tooltip />
          <Area
            type="monotone"
            dataKey="count"
            stroke="#1976d2"
            fill="url(#trendFill)"
          />
        </AreaChart>
      </ResponsiveContainer>
    </Box>
  );
}
