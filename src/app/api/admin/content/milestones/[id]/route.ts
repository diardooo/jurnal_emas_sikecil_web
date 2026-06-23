import { adminResource } from "@/lib/admin";
import { refMilestones } from "@/db/schema/admin";

const r = adminResource(refMilestones);
export const PATCH = r.PATCH;
export const DELETE = r.DELETE;
