import { adminResource } from "@/lib/admin";
import { refSleep } from "@/db/schema/admin";

const r = adminResource(refSleep);
export const PATCH = r.PATCH;
export const DELETE = r.DELETE;
