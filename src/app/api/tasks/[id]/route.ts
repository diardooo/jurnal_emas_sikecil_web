import { resource } from "@/lib/api";
import { tasks } from "@/db/schema/app";

const r = resource(tasks);
export const PATCH = r.PATCH;
export const DELETE = r.DELETE;
