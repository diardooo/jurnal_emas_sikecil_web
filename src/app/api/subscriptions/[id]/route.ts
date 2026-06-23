import { resource } from "@/lib/api";
import { subscriptions } from "@/db/schema/app";

const r = resource(subscriptions);
export const PATCH = r.PATCH;
export const DELETE = r.DELETE;
