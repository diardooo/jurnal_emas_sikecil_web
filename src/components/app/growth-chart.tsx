"use client";

import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type { GrowthRecord } from "@/lib/types";

export function GrowthChart({
  data,
  metric,
}: {
  data: GrowthRecord[];
  metric: "weight" | "height";
}) {
  const color = metric === "weight" ? "#C9A227" : "#7BA05B";
  const unit = metric === "weight" ? "kg" : "cm";

  return (
    <ResponsiveContainer width="100%" height={260}>
      <LineChart data={data} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
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
          width={40}
          tickFormatter={(v) => `${v}`}
        />
        <Tooltip
          contentStyle={{
            borderRadius: 12,
            border: "1px solid #EAE3D2",
            fontSize: 13,
          }}
          formatter={(v: number) => [`${v} ${unit}`, metric === "weight" ? "Berat" : "Tinggi"]}
          labelFormatter={(l) => `Usia ${l} bulan`}
        />
        <Line
          type="monotone"
          dataKey={metric}
          stroke={color}
          strokeWidth={3}
          dot={{ r: 4, fill: color, strokeWidth: 0 }}
          activeDot={{ r: 6 }}
        />
      </LineChart>
    </ResponsiveContainer>
  );
}
