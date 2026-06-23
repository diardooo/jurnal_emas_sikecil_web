/**
 * Reference data every new child starts with: the full milestone checklist
 * (status "belum"), the IDAI immunization schedule (status "akan-datang"),
 * and the primary-teeth list (not yet erupted). Derived from the master lists
 * in mock-data so there's a single source of truth.
 */
import {
  mockImmunizations,
  mockMilestones,
  mockTeeth,
} from "./mock-data";

export const milestoneTemplate = mockMilestones.map((m) => ({
  title: m.title,
  description: m.description,
  domain: m.domain,
  ageMinMonths: m.ageMinMonths,
  ageMaxMonths: m.ageMaxMonths,
  isCritical: m.isCritical,
  status: "belum" as const,
}));

export const immunizationSchedule = mockImmunizations.c1.map((im) => ({
  vaccine: im.vaccine,
  ageLabel: im.ageLabel,
  ageMonths: im.ageMonths,
  status: "akan-datang" as const,
}));

export const primaryTeeth = mockTeeth.c1.map((t) => ({
  name: t.name,
  typicalAgeLabel: t.typicalAgeLabel,
  erupted: false,
}));

/** Build insert rows for a child's starter reference data. */
export function childReferenceRows(userId: string, childId: string) {
  return {
    milestones: milestoneTemplate.map((m) => ({ ...m, userId, childId })),
    immunizations: immunizationSchedule.map((im) => ({ ...im, userId, childId })),
    teeth: primaryTeeth.map((t) => ({ ...t, userId, childId })),
  };
}
