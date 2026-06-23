import { resource } from "@/lib/api";
import { children } from "@/db/schema/app";

const r = resource(children);
export const PATCH = r.PATCH;
export const DELETE = r.DELETE;
