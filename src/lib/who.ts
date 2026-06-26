import { whoReference } from "./mock-data";
import { whoLms, type Lms, type WhoSex } from "./who-lms";

export type WhoMetric = "weight" | "height" | "headCirc";
export type { WhoSex };

/** Highest age (months) covered by the WHO 0–5y standards. */
const WHO_MAX_MONTHS = 60;

interface RefPoint {
  ageMonths: number;
  p3: number;
  p50: number;
  p97: number;
}

/** Linear-interpolate a reference point at a given age (legacy sex-agnostic band). */
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

/* ------------------------------------------------------------------ *
 *  Sex-specific WHO z-scores (LMS method)                            *
 * ------------------------------------------------------------------ */

/** Interpolate LMS coefficients at a (possibly fractional) age in months. */
function lmsAt(metric: WhoMetric, sex: WhoSex, ageMonths: number): Lms | null {
  const arr = whoLms[metric]?.[sex];
  if (!arr || arr.length === 0) return null;
  const max = arr.length - 1;
  const a = Math.max(0, Math.min(ageMonths, max));
  const lo = Math.floor(a);
  const hi = Math.ceil(a);
  if (lo === hi) return arr[lo];
  const t = a - lo;
  const p = arr[lo];
  const q = arr[hi];
  return {
    l: p.l + (q.l - p.l) * t,
    m: p.m + (q.m - p.m) * t,
    s: p.s + (q.s - p.s) * t,
  };
}

/** Measurement value at a given z (SD) from LMS coefficients (WHO formula). */
function valueAtZ({ l, m, s }: Lms, z: number): number {
  return l === 0 ? m * Math.exp(s * z) : m * Math.pow(1 + l * s * z, 1 / l);
}

/**
 * WHO z-score for a measurement, sex- and age-specific via the LMS method,
 * including the official tail adjustment for |z| > 3. Returns null when the
 * age is outside the WHO 0–5y standard or the value is non-positive.
 */
export function whoZScore(
  metric: WhoMetric,
  sex: WhoSex,
  ageMonths: number,
  value: number,
): number | null {
  if (ageMonths < 0 || ageMonths > WHO_MAX_MONTHS || value <= 0) return null;
  const c = lmsAt(metric, sex, ageMonths);
  if (!c) return null;
  const { l, m, s } = c;
  let z =
    l === 0 ? Math.log(value / m) / s : (Math.pow(value / m, l) - 1) / (l * s);
  if (z > 3) {
    const sd3 = valueAtZ(c, 3);
    const gap = sd3 - valueAtZ(c, 2);
    z = 3 + (value - sd3) / gap;
  } else if (z < -3) {
    const sd3 = valueAtZ(c, -3);
    const gap = valueAtZ(c, -2) - sd3;
    z = -3 + (value - sd3) / gap;
  }
  return z;
}

/** Standard-normal CDF → percentile (0–100). Zelen & Severo approximation. */
export function zToPercentile(z: number): number {
  const b1 = 0.31938153;
  const b2 = -0.356563782;
  const b3 = 1.781477937;
  const b4 = -1.821255978;
  const b5 = 1.330274429;
  const p = 0.2316419;
  const c = 0.39894228;
  const az = Math.abs(z);
  const t = 1 / (1 + p * az);
  const poly = t * (b1 + t * (b2 + t * (b3 + t * (b4 + t * b5))));
  const tail = c * Math.exp((-az * az) / 2) * poly;
  const cdf = z >= 0 ? 1 - tail : tail;
  return cdf * 100;
}

export interface WhoStatus {
  label: string;
  tone: "success" | "warning" | "destructive";
  /** WHO z-score (only when classified via the sex-specific standard). */
  z?: number;
  /** Percentile 0–100 (only when classified via the sex-specific standard). */
  percentile?: number;
}

/** Calm, evidence-based classification of a z-score per WHO indicator. */
function classifyByZ(metric: WhoMetric, z: number): WhoStatus {
  const base = { z, percentile: zToPercentile(z) };
  if (metric === "height") {
    // length/height-for-age → stunting
    if (z < -3) return { label: "Sangat pendek (stunting berat)", tone: "destructive", ...base };
    if (z < -2) return { label: "Pendek (stunting)", tone: "warning", ...base };
    if (z > 3) return { label: "Tinggi di atas rata-rata", tone: "success", ...base };
    return { label: "Tinggi sesuai WHO", tone: "success", ...base };
  }
  if (metric === "headCirc") {
    if (z < -2) return { label: "Lingkar kepala kecil", tone: "warning", ...base };
    if (z > 2) return { label: "Lingkar kepala besar", tone: "warning", ...base };
    return { label: "Lingkar kepala sesuai WHO", tone: "success", ...base };
  }
  // weight-for-age
  if (z < -3) return { label: "Berat sangat kurang", tone: "destructive", ...base };
  if (z < -2) return { label: "Berat kurang", tone: "warning", ...base };
  if (z > 2) return { label: "Berat di atas rata-rata", tone: "warning", ...base };
  return { label: "Berat sesuai WHO", tone: "success", ...base };
}

/**
 * Classify a measurement against the WHO standard.
 *
 * When `sex` is provided and the child is within the WHO 0–5y range, this uses
 * the sex-specific LMS z-score (medically correct). Otherwise it falls back to
 * the legacy sex-agnostic p3–p97 band, so existing callers keep working.
 */
export function classifyWho(
  metric: WhoMetric,
  ageMonths: number,
  value: number,
  sex?: WhoSex,
): WhoStatus {
  if (sex) {
    const z = whoZScore(metric, sex, ageMonths, value);
    if (z != null) return classifyByZ(metric, z);
  }
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

/** z for the 3rd / 97th percentile (≈ ±1.8808 SD). */
const Z_P3 = -1.880794;
const Z_P97 = 1.880794;
const round1 = (n: number) => Number(n.toFixed(1));

/**
 * Build chart rows merging a child's measurements with the WHO normal band.
 * When `sex` is provided (and within 0–5y) the band is derived from the
 * sex-specific LMS curve; otherwise it uses the legacy sex-agnostic band.
 */
export function buildChartData(
  metric: WhoMetric,
  records: { ageMonths: number; weight: number; height: number; headCirc?: number }[],
  sex?: WhoSex,
) {
  const valueOf = (r: (typeof records)[number]) =>
    metric === "weight" ? r.weight : metric === "height" ? r.height : r.headCirc;

  return records
    .map((r) => {
      const v = valueOf(r);
      if (v == null) return null;
      let p3: number;
      let p50: number;
      let p97: number;
      const c = sex && r.ageMonths <= WHO_MAX_MONTHS ? lmsAt(metric, sex, r.ageMonths) : null;
      if (c) {
        p3 = valueAtZ(c, Z_P3);
        p50 = c.m;
        p97 = valueAtZ(c, Z_P97);
      } else {
        const ref = interpolateRef(metric, r.ageMonths);
        p3 = ref.p3;
        p50 = ref.p50;
        p97 = ref.p97;
      }
      return {
        ageMonths: r.ageMonths,
        value: v,
        p3: round1(p3),
        p50: round1(p50),
        // band height for stacked area (p97 - p3)
        band: round1(p97 - p3),
        p97: round1(p97),
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
