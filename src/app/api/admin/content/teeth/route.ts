import { adminResource } from "@/lib/admin";
import { refTeeth } from "@/db/schema/admin";

const r = adminResource(refTeeth);
export const GET = r.GET;
export const POST = r.POST;
