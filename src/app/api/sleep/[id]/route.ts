import { resource } from "@/lib/api";
import { sleepLogs } from "@/db/schema/app";

const r = resource(sleepLogs);
export const PATCH = r.PATCH;
export const DELETE = r.DELETE;
