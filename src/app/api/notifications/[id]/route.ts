import { resource } from "@/lib/api";
import { notifications } from "@/db/schema/app";

const r = resource(notifications);
export const PATCH = r.PATCH;
export const DELETE = r.DELETE;
