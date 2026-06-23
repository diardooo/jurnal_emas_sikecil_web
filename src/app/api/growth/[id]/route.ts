import { resource } from "@/lib/api";
import { growthRecords } from "@/db/schema/app";

const r = resource(growthRecords);
export const PATCH = r.PATCH;
export const DELETE = r.DELETE;
