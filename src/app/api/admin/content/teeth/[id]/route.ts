import { adminResource } from "@/lib/admin";
import { refTeeth } from "@/db/schema/admin";

const r = adminResource(refTeeth);
export const PATCH = r.PATCH;
export const DELETE = r.DELETE;
