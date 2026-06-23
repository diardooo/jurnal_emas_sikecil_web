import { adminResource } from "@/lib/admin";
import { refMilestones } from "@/db/schema/admin";
import { validateMilestoneDomain } from "@/lib/milestone-validation";

const r = adminResource(refMilestones, { validate: validateMilestoneDomain });
export const GET = r.GET;
export const POST = r.POST;
