import { resource } from "@/lib/api";
import { goals } from "@/db/schema/app";

const r = resource(goals);
export const GET = r.GET;
export const POST = r.POST;
