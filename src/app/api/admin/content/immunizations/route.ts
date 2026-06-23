import { adminResource } from "@/lib/admin";
import { refImmunizations } from "@/db/schema/admin";

const r = adminResource(refImmunizations);
export const GET = r.GET;
export const POST = r.POST;
