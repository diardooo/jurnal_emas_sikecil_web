import { resource } from "@/lib/api";
import { immunizations } from "@/db/schema/app";

const r = resource(immunizations);
export const PATCH = r.PATCH;
export const DELETE = r.DELETE;
