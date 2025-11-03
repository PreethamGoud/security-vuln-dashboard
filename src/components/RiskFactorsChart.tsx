import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import type { RiskFactorBucket } from "../data/query";

type Props = {
  data: RiskFactorBucket[];
};

export default function RiskFactorsChart({ data }: Props) {
  if (!data || data.length === 0) {
    return (
      <div style={{ textAlign: "center", padding: "2rem", color: "#999" }}>
        No risk factors data available
      </div>
    );
  }

  return (
    <ResponsiveContainer width="100%" height={280}>
      <BarChart
        data={data}
        layout="vertical"
        margin={{ top: 5, right: 20, bottom: 5, left: 120 }}
      >
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis type="number" />
        <YAxis
          type="category"
          dataKey="factor"
          width={110}
          tick={{ fontSize: 12 }}
        />
        <Tooltip />
        <Bar dataKey="count" fill="#ff9800" />
      </BarChart>
    </ResponsiveContainer>
  );
}
