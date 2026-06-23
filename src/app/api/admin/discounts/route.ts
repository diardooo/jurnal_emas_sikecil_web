import { adminResource } from "@/lib/admin";
import { discountCodes } from "@/db/schema/admin";

const r = adminResource(discountCodes);
export const GET = r.GET;
export const POST = r.POST;
