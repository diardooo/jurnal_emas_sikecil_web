import { resource } from "@/lib/api";
import { todos } from "@/db/schema/app";

const r = resource(todos);
export const PATCH = r.PATCH;
export const DELETE = r.DELETE;
