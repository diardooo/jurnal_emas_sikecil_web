import { adminResource } from "@/lib/admin";
import { discountCodes } from "@/db/schema/admin";

const r = adminResource(discountCodes);
export const PATCH = r.PATCH;
export const DELETE = r.DELETE;
