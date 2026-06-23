import { adminResource } from "@/lib/admin";
import { refMilestones } from "@/db/schema/admin";

const r = adminResource(refMilestones);
export const GET = r.GET;
export const POST = r.POST;
