import { adminResource } from "@/lib/admin";
import { refSleep } from "@/db/schema/admin";

const r = adminResource(refSleep);
export const GET = r.GET;
export const POST = r.POST;
