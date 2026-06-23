import { resource } from "@/lib/api";
import { teeth } from "@/db/schema/app";

const r = resource(teeth);
export const PATCH = r.PATCH;
export const DELETE = r.DELETE;
