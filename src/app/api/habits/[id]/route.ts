import { resource } from "@/lib/api";
import { habits } from "@/db/schema/app";

const r = resource(habits);
export const PATCH = r.PATCH;
export const DELETE = r.DELETE;
