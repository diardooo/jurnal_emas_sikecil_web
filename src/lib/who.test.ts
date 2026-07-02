import { describe, expect, it } from "vitest";
import {
  buildChartData,
  classifyWho,
  interpolateRef,
  whoZScore,
  zToPercentile,
} from "@/lib/who";
import { whoLms, type Lms, type WhoSex } from "@/lib/who-lms";

/**
 * Golden-vector tests for the WHO growth engine (JES-103).
 *
 * A wrong z-score would tell a parent their healthy child is stunted, or
 * reassure them when the child needs attention. These tests pin the behaviour of
 * `who.ts` against known-correct inputs so any regression fails the gate.
 *
 * Strategy:
 *  - Round-trip: `valueAtZ` (re-implemented here from the WHO LMS formula, using
 *    the official coefficients in `who-lms.ts`) → feed into `whoZScore` → must
 *    return the same z. This is an independent inverse of the code's forward
 *    calc, so a formula regression in `who.ts` breaks it.
 *  - Percentile is checked against the standard-normal CDF (fully independent).
 *  - Classification, tail-extrapolation, boundaries, and chart bands are pinned.
 */

/** WHO LMS forward formula (measurement value at a given z). Mirrors who.ts. */
function valueAtZ(c: Lms, z: number): number {
  return c.l === 0
    ? c.m * Math.exp(c.s * z)
    : c.m * Math.pow(1 + c.l * c.s * z, 1 / c.l);
}

const METRICS = ["weight", "height", "headCirc"] as const;
const SEXES: WhoSex[] = ["L", "P"];
const AGES = [0, 12, 24, 60]; // include both boundaries of the WHO 0–5y range
const Z_IN_RANGE = [-3, -2, -1, 0, 1, 2, 3];

describe("whoZScore — round-trip against official LMS coefficients", () => {
  for (const metric of METRICS) {
    for (const sex of SEXES) {
      for (const age of AGES) {
        for (const z of Z_IN_RANGE) {
          const coeff = whoLms[metric][sex][age];
          const value = valueAtZ(coeff, z);
          // Skip physically impossible (non-positive) constructions.
          if (!(value > 0)) continue;
          it(`${metric}/${sex}/${age}mo: value at z=${z} maps back to z=${z}`, () => {
            const got = whoZScore(metric, sex, age, value);
            expect(got).not.toBeNull();
            expect(got as number).toBeCloseTo(z, 6);
          });
        }
      }
    }
  }
});

describe("whoZScore — fractional age interpolates the LMS coefficients", () => {
  it("weight/L at 6.5mo uses coefficients half-way between 6 and 7 months", () => {
    const a = whoLms.weight.L[6];
    const b = whoLms.weight.L[7];
    // Reproduce lmsAt's linear interpolation at t=0.5, independently.
    const mid: Lms = {
      l: a.l + (b.l - a.l) * 0.5,
      m: a.m + (b.m - a.m) * 0.5,
      s: a.s + (b.s - a.s) * 0.5,
    };
    const valueAtMedian = valueAtZ(mid, 0);
    expect(whoZScore("weight", "L", 6.5, valueAtMedian) as number).toBeCloseTo(0, 6);
  });
});

describe("whoZScore — median maps to z=0 (data-as-truth anchor)", () => {
  for (const metric of METRICS) {
    for (const sex of SEXES) {
      for (const age of [0, 24, 60]) {
        it(`${metric}/${sex}/${age}mo: median (m) → z≈0`, () => {
          const median = whoLms[metric][sex][age].m;
          expect(whoZScore(metric, sex, age, median) as number).toBeCloseTo(0, 9);
        });
      }
    }
  }
});

describe("whoZScore — tail extrapolation for |z| > 3 (WHO SD-band method)", () => {
  const c = whoLms.weight.L[24];
  const sd3 = valueAtZ(c, 3);
  const sd2 = valueAtZ(c, 2);
  const sdNeg3 = valueAtZ(c, -3);
  const sdNeg2 = valueAtZ(c, -2);

  it("just above +3SD stays exactly 3 at the boundary", () => {
    expect(whoZScore("weight", "L", 24, sd3) as number).toBeCloseTo(3, 6);
  });

  it("beyond +3SD extrapolates linearly on the 2–3SD interval", () => {
    const value = valueAtZ(c, 4); // raw LMS z would be 4 → triggers the tail path
    const expected = 3 + (value - sd3) / (sd3 - sd2);
    expect(whoZScore("weight", "L", 24, value) as number).toBeCloseTo(expected, 6);
    expect(whoZScore("weight", "L", 24, value) as number).toBeGreaterThan(3);
  });

  it("below -3SD extrapolates linearly and stays < -3", () => {
    const value = valueAtZ(c, -4);
    const expected = -3 + (value - sdNeg3) / (sdNeg2 - sdNeg3);
    expect(whoZScore("weight", "L", 24, value) as number).toBeCloseTo(expected, 6);
    expect(whoZScore("weight", "L", 24, value) as number).toBeLessThan(-3);
  });

  it("is monotonic: a larger measurement yields a larger z", () => {
    const zLo = whoZScore("weight", "L", 24, valueAtZ(c, 3.5)) as number;
    const zHi = whoZScore("weight", "L", 24, valueAtZ(c, 4.5)) as number;
    expect(zHi).toBeGreaterThan(zLo);
  });
});

describe("whoZScore — boundary & invalid inputs return null", () => {
  it("age below 0 → null", () => {
    expect(whoZScore("weight", "L", -1, 3.3)).toBeNull();
  });
  it("age above 60 → null", () => {
    expect(whoZScore("weight", "L", 61, 20)).toBeNull();
  });
  it("non-positive value → null", () => {
    expect(whoZScore("weight", "L", 12, 0)).toBeNull();
    expect(whoZScore("weight", "L", 12, -5)).toBeNull();
  });
  it("exact boundaries age 0 and 60 are valid (not null)", () => {
    expect(whoZScore("weight", "L", 0, whoLms.weight.L[0].m)).not.toBeNull();
    expect(whoZScore("weight", "L", 60, whoLms.weight.L[60].m)).not.toBeNull();
  });
});

describe("zToPercentile — against the standard-normal CDF", () => {
  const cases: [number, number][] = [
    [0, 50],
    [1, 84.13],
    [-1, 15.87],
    [2, 97.72],
    [-2, 2.28],
    [1.645, 95.0],
    [3, 99.87],
  ];
  for (const [z, pct] of cases) {
    it(`z=${z} → ~${pct} percentile`, () => {
      expect(zToPercentile(z)).toBeCloseTo(pct, 0); // within 0.5
    });
  }
  it("is symmetric around 50", () => {
    expect(zToPercentile(1.2) + zToPercentile(-1.2)).toBeCloseTo(100, 5);
  });
});

describe("classifyWho — stunting / underweight / head-circ bands", () => {
  // Build a measurement at a target z from the official coefficients, then class.
  const at = (metric: (typeof METRICS)[number], sex: WhoSex, age: number, z: number) =>
    valueAtZ(whoLms[metric][sex][age], z);

  it("height z<-3 → severe stunting (destructive)", () => {
    const s = classifyWho("height", 24, at("height", "L", 24, -3.5), "L");
    expect(s.tone).toBe("destructive");
    expect(s.label).toMatch(/stunting berat/i);
  });
  it("height -3<z<-2 → stunting (warning)", () => {
    const s = classifyWho("height", 24, at("height", "L", 24, -2.5), "L");
    expect(s.tone).toBe("warning");
    expect(s.label).toMatch(/stunting/i);
  });
  it("height z≈0 → sesuai WHO (success)", () => {
    const s = classifyWho("height", 24, at("height", "L", 24, 0), "L");
    expect(s.tone).toBe("success");
  });
  it("weight z<-3 → berat sangat kurang (destructive)", () => {
    const s = classifyWho("weight", 12, at("weight", "P", 12, -3.5), "P");
    expect(s.tone).toBe("destructive");
  });
  it("weight -3<z<-2 → berat kurang (warning)", () => {
    const s = classifyWho("weight", 12, at("weight", "P", 12, -2.5), "P");
    expect(s.tone).toBe("warning");
  });
  it("weight z>2 → di atas rata-rata (warning)", () => {
    const s = classifyWho("weight", 12, at("weight", "P", 12, 2.5), "P");
    expect(s.tone).toBe("warning");
  });
  it("headCirc |z|>2 → flagged (warning) on both sides", () => {
    expect(classifyWho("headCirc", 6, at("headCirc", "L", 6, -2.5), "L").tone).toBe("warning");
    expect(classifyWho("headCirc", 6, at("headCirc", "L", 6, 2.5), "L").tone).toBe("warning");
  });
  it("height z>3 → tinggi di atas rata-rata (success)", () => {
    const s = classifyWho("height", 24, at("height", "L", 24, 3.5), "L");
    expect(s.tone).toBe("success");
    expect(s.label).toMatch(/di atas rata-rata/i);
  });
  it("attaches z + percentile when classified via the sex-specific standard", () => {
    const s = classifyWho("weight", 24, whoLms.weight.L[24].m, "L");
    expect(s.z).toBeCloseTo(0, 6);
    expect(s.percentile).toBeCloseTo(50, 0);
  });
});

describe("classifyWho — legacy sex-agnostic fallback (no sex / age > 60)", () => {
  it("returns a status without z when sex is omitted", () => {
    const s = classifyWho("weight", 12, 9.6);
    expect(s.label).toBeTruthy();
    expect(s.z).toBeUndefined();
  });
  it("uses the fallback band beyond the WHO 0–5y range", () => {
    const s = classifyWho("height", 72, 110, "L");
    expect(s.z).toBeUndefined(); // z-score path unavailable > 60mo
    expect(s.label).toBeTruthy();
  });

  it("weight below/above the legacy band → warning labels", () => {
    const ref = interpolateRef("weight", 12);
    expect(classifyWho("weight", 12, ref.p3 - 1).label).toMatch(/kurang/i);
    expect(classifyWho("weight", 12, ref.p3 - 1).tone).toBe("warning");
    expect(classifyWho("weight", 12, ref.p97 + 1).label).toMatch(/lebih/i);
    expect(classifyWho("weight", 12, ref.p97 + 1).tone).toBe("warning");
  });

  it("non-weight metric below/above the legacy band → range labels", () => {
    const ref = interpolateRef("height", 12);
    expect(classifyWho("height", 12, ref.p3 - 1).label).toMatch(/di bawah/i);
    expect(classifyWho("height", 12, ref.p97 + 1).label).toMatch(/di atas/i);
  });

  it("within the legacy band → sesuai rentang WHO (success)", () => {
    const ref = interpolateRef("weight", 12);
    expect(classifyWho("weight", 12, ref.p50).tone).toBe("success");
  });
});

describe("interpolateRef — clamps and interpolates the legacy band", () => {
  it("returns ordered p3 < p50 < p97", () => {
    const r = interpolateRef("weight", 10);
    expect(r.p3).toBeLessThan(r.p50);
    expect(r.p50).toBeLessThan(r.p97);
  });
});

describe("buildChartData — merges measurements with the WHO band", () => {
  const records = [
    { ageMonths: 0, weight: whoLms.weight.L[0].m, height: whoLms.height.L[0].m },
    { ageMonths: 24, weight: whoLms.weight.L[24].m, height: whoLms.height.L[24].m },
  ];

  it("plots the child value and a p3<p50<p97 band (sex-specific)", () => {
    const rows = buildChartData("weight", records, "L");
    expect(rows).toHaveLength(2);
    for (const row of rows) {
      expect(row.p3).toBeLessThan(row.p50);
      expect(row.p50).toBeLessThan(row.p97);
      // band is the stacked-area height between p3 and p97
      expect(row.band).toBeCloseTo(Number((row.p97 - row.p3).toFixed(1)), 5);
    }
  });

  it("p50 equals the median at that age (rounded)", () => {
    const rows = buildChartData("weight", records, "L");
    expect(rows[1].p50).toBeCloseTo(Number(whoLms.weight.L[24].m.toFixed(1)), 5);
  });

  it("skips records whose metric value is missing", () => {
    const rows = buildChartData("headCirc", records, "L"); // records have no headCirc
    expect(rows).toHaveLength(0);
  });

  it("falls back to the legacy band when sex is omitted", () => {
    const rows = buildChartData("weight", records); // no sex → interpolateRef path
    expect(rows).toHaveLength(2);
    for (const row of rows) {
      expect(row.p3).toBeLessThan(row.p97);
      expect(row.band).toBeCloseTo(Number((row.p97 - row.p3).toFixed(1)), 5);
    }
  });
});
