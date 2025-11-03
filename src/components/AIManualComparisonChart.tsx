import { useEffect, useState } from "react";
import { Paper, Typography, Box, Skeleton, Stack, Chip } from "@mui/material";
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Legend,
  Tooltip,
} from "recharts";
import { db } from "../data/db";

type AnalysisStats = {
  manualInvalid: number; // invalid - norisk
  aiInvalid: number; // ai-invalid-norisk
  both: number; // Items marked invalid by both
  validOrOther: number; // Everything else
  total: number;
};

const COLORS = {
  manualOnly: "#f44336", // red
  aiOnly: "#9c27b0", // purple
  both: "#ff9800", // orange
  valid: "#4caf50", // green
};

export default function AIManualComparisonChart() {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<AnalysisStats | null>(null);

  useEffect(() => {
    let alive = true;
    (async () => {
      setLoading(true);

      let manualInvalid = 0;
      let aiInvalid = 0;
      let both = 0;
      let validOrOther = 0;

      await db.vulnerabilities.each((v) => {
        const ks = (v.kaiStatus || "").toLowerCase();
        const isManual = ks === "invalid - norisk";
        const isAI = ks === "ai-invalid-norisk";

        if (isManual && isAI) {
          both++;
        } else if (isManual) {
          manualInvalid++;
        } else if (isAI) {
          aiInvalid++;
        } else {
          validOrOther++;
        }
      });

      if (!alive) return;

      const total = manualInvalid + aiInvalid + both + validOrOther;
      setStats({ manualInvalid, aiInvalid, both, validOrOther, total });
      setLoading(false);
    })();

    return () => {
      alive = false;
    };
  }, []);

  if (loading) {
    return <Skeleton variant="rectangular" height={300} />;
  }

  if (!stats) {
    return (
      <Typography variant="body2" color="text.secondary">
        No data available
      </Typography>
    );
  }

  // Prepare data for pie chart
  const pieData = [
    {
      name: "Manual Invalid Only",
      value: stats.manualInvalid,
      color: COLORS.manualOnly,
    },
    { name: "AI Invalid Only", value: stats.aiInvalid, color: COLORS.aiOnly },
    { name: "Both Invalid", value: stats.both, color: COLORS.both },
    { name: "Valid/Other", value: stats.validOrOther, color: COLORS.valid },
  ].filter((item) => item.value > 0);

  const agreementRate =
    stats.total > 0
      ? (((stats.validOrOther + stats.both) / stats.total) * 100).toFixed(1)
      : "0.0";

  return (
    <Paper sx={{ p: 2 }}>
      <Typography variant="subtitle1" gutterBottom>
        AI vs Manual Analysis Comparison
      </Typography>

      <Stack
        direction="row"
        spacing={1}
        sx={{ mb: 2 }}
        flexWrap="wrap"
        useFlexGap
      >
        <Chip
          size="small"
          label={`Agreement: ${agreementRate}%`}
          color="info"
        />
        <Chip
          size="small"
          label={`Manual: ${stats.manualInvalid + stats.both}`}
          sx={{ bgcolor: COLORS.manualOnly, color: "white" }}
        />
        <Chip
          size="small"
          label={`AI: ${stats.aiInvalid + stats.both}`}
          sx={{ bgcolor: COLORS.aiOnly, color: "white" }}
        />
        <Chip
          size="small"
          label={`Overlap: ${stats.both}`}
          sx={{ bgcolor: COLORS.both, color: "white" }}
        />
      </Stack>

      <ResponsiveContainer width="100%" height={280}>
        <PieChart>
          <Pie
            data={pieData}
            cx="50%"
            cy="50%"
            labelLine={false}
            label={(entry: any) =>
              `${entry.name}: ${((entry.percent || 0) * 100).toFixed(1)}%`
            }
            outerRadius={80}
            fill="#8884d8"
            dataKey="value"
          >
            {pieData.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={entry.color} />
            ))}
          </Pie>
          <Tooltip />
          <Legend />
        </PieChart>
      </ResponsiveContainer>

      <Box sx={{ mt: 2, p: 2, bgcolor: "grey.50", borderRadius: 1 }}>
        <Typography variant="caption" color="text.secondary">
          <strong>Interpretation:</strong> This chart shows how AI and manual
          analysis results compare. "Both Invalid" indicates cases where both
          methods flagged the CVE as invalid/no-risk, suggesting high confidence
          in dismissal.
        </Typography>
      </Box>
    </Paper>
  );
}
