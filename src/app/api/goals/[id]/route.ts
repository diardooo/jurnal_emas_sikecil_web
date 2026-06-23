import { resource } from "@/lib/api";
import { goals } from "@/db/schema/app";

const r = resource(goals);
export const PATCH = r.PATCH;
export const DELETE = r.DELETE;
