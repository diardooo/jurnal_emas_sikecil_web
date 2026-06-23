import { adminResource } from "@/lib/admin";
import { refImmunizations } from "@/db/schema/admin";

const r = adminResource(refImmunizations);
export const PATCH = r.PATCH;
export const DELETE = r.DELETE;
