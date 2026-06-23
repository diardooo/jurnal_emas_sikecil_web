import { adminResource } from "@/lib/admin";
import { refMilestones } from "@/db/schema/admin";
import { validateMilestoneDomain } from "@/lib/milestone-validation";

const r = adminResource(refMilestones, { validate: validateMilestoneDomain });
export const PATCH = r.PATCH;
export const DELETE = r.DELETE;
