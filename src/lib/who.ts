import { whoReference } from "./mock-data";

export type WhoMetric = "weight" | "height" | "headCirc";

interface RefPoint {
  ageMonths: number;
  p3: number;
  p50: number;
  p97: number;
}

/** Linear-interpolate a reference point at a given age. */
export function interpolateRef(metric: WhoMetric, ageMonths: number): RefPoint {
  const ref = whoReference[metric] as readonly RefPoint[];
  if (ageMonths <= ref[0].ageMonths) return ref[0];
  if (ageMonths >= ref[ref.length - 1].ageMonths) return ref[ref.length - 1];
  for (let i = 0; i < ref.length - 1; i++) {
    const a = ref[i];
    const b = ref[i + 1];
    if (ageMonths >= a.ageMonths && ageMonths <= b.ageMonths) {
      const t = (ageMonths - a.ageMonths) / (b.ageMonths - a.ageMonths);
      return {
        ageMonths,
        p3: a.p3 + (b.p3 - a.p3) * t,
        p50: a.p50 + (b.p50 - a.p50) * t,
        p97: a.p97 + (b.p97 - a.p97) * t,
      };
    }
  }
  return ref[ref.length - 1];
}

export interface WhoStatus {
  label: string;
  tone: "success" | "warning" | "destructive";
}

/** Classify a measurement against the WHO normal band (p3–p97). */
export function classifyWho(
  metric: WhoMetric,
  ageMonths: number,
  value: number,
): WhoStatus {
  const ref = interpolateRef(metric, ageMonths);
  if (value < ref.p3) {
    return {
      label: metric === "weight" ? "Berat kurang" : "Di bawah rentang",
      tone: "warning",
    };
  }
  if (value > ref.p97) {
    return {
      label: metric === "weight" ? "Berat lebih" : "Di atas rentang",
      tone: "warning",
    };
  }
  return { label: "Sesuai rentang WHO", tone: "success" };
}

/** Build chart rows merging a child's measurements with the WHO band. */
export function buildChartData(
  metric: WhoMetric,
  records: { ageMonths: number; weight: number; height: number; headCirc?: number }[],
) {
  const valueOf = (r: (typeof records)[number]) =>
    metric === "weight" ? r.weight : metric === "height" ? r.height : r.headCirc;

  return records
    .map((r) => {
      const v = valueOf(r);
      if (v == null) return null;
      const ref = interpolateRef(metric, r.ageMonths);
      return {
        ageMonths: r.ageMonths,
        value: v,
        p3: Number(ref.p3.toFixed(1)),
        p50: Number(ref.p50.toFixed(1)),
        // band height for stacked area (p97 - p3)
        band: Number((ref.p97 - ref.p3).toFixed(1)),
        p97: Number(ref.p97.toFixed(1)),
      };
    })
    .filter(Boolean) as {
    ageMonths: number;
    value: number;
    p3: number;
    p50: number;
    band: number;
    p97: number;
  }[];
}
