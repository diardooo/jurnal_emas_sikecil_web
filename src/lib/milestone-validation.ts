import { MILESTONE_DOMAINS } from "@/lib/types";

const DOMAINS = new Set<string>(MILESTONE_DOMAINS);

/**
 * Reject milestone writes whose `domain` isn't one of the canonical
 * {@link MILESTONE_DOMAINS}. An unknown domain has no icon/color in the goals
 * page's `domainMeta` map, which previously crashed the whole page. On PATCH
 * `domain` may be absent (partial update); we only validate when present.
 */
export function validateMilestoneDomain(
  body: Record<string, unknown>,
): string | null {
  if (!("domain" in body)) return null;
  if (typeof body.domain !== "string" || !DOMAINS.has(body.domain)) {
    return `Domain tidak valid. Pilih salah satu: ${MILESTONE_DOMAINS.join(", ")}`;
  }
  return null;
}
