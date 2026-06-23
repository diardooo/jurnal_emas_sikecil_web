"use client";

import {
  Area,
  CartesianGrid,
  ComposedChart,
  Line,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { buildChartData, type WhoMetric } from "@/lib/who";
import type { GrowthRecord } from "@/lib/types";

const meta: Record<WhoMetric, { color: string; unit: string; label: string }> = {
  weight: { color: "#C9A227", unit: "kg", label: "Berat" },
  height: { color: "#7BA05B", unit: "cm", label: "Tinggi" },
  headCirc: { color: "#F4A261", unit: "cm", label: "Lingkar kepala" },
};

export function WhoGrowthChart({
  data,
  metric,
}: {
  data: GrowthRecord[];
  metric: WhoMetric;
}) {
  const rows = buildChartData(metric, data);
  const m = meta[metric];

  return (
    <ResponsiveContainer width="100%" height={280}>
      <ComposedChart data={rows} margin={{ top: 10, right: 12, left: -8, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#EAE3D2" vertical={false} />
        <XAxis
          dataKey="ageMonths"
          tickLine={false}
          axisLine={false}
          tick={{ fontSize: 12, fill: "#4A4A66" }}
          tickFormatter={(v) => `${v}bln`}
        />
        <YAxis
          tickLine={false}
          axisLine={false}
          tick={{ fontSize: 12, fill: "#4A4A66" }}
          width={42}
          domain={["dataMin - 1", "dataMax + 1"]}
        />
        <Tooltip
          contentStyle={{ borderRadius: 12, border: "1px solid #EAE3D2", fontSize: 13 }}
          labelFormatter={(l) => `Usia ${l} bulan`}
          formatter={(value: number, name: string) => {
            const labels: Record<string, string> = {
              value: m.label,
              p50: "Median WHO",
              p3: "Batas bawah (p3)",
            };
            if (name === "band") return [null, null] as never;
            return [`${value} ${m.unit}`, labels[name] ?? name];
          }}
        />
        {/* Normal band p3..p97 (stacked: invisible base to p3, then band height) */}
        <Area
          type="monotone"
          dataKey="p3"
          stackId="band"
          stroke="none"
          fill="transparent"
          isAnimationActive={false}
          activeDot={false}
        />
        <Area
          type="monotone"
          dataKey="band"
          stackId="band"
          stroke="none"
          fill="#7BA05B"
          fillOpacity={0.14}
          isAnimationActive={false}
          activeDot={false}
        />
        {/* WHO median */}
        <Line
          type="monotone"
          dataKey="p50"
          stroke="#9CA3AF"
          strokeWidth={1.5}
          strokeDasharray="5 4"
          dot={false}
          activeDot={false}
        />
        {/* Child measurements */}
        <Line
          type="monotone"
          dataKey="value"
          stroke={m.color}
          strokeWidth={3}
          dot={{ r: 4, fill: m.color, strokeWidth: 0 }}
          activeDot={{ r: 6 }}
        />
      </ComposedChart>
    </ResponsiveContainer>
  );
}
