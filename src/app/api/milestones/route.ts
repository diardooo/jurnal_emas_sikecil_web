import { resource } from "@/lib/api";
import { milestones } from "@/db/schema/app";

const r = resource(milestones);
export const GET = r.GET;
export const POST = r.POST;
