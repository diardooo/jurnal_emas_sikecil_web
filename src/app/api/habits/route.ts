import { resource } from "@/lib/api";
import { habits } from "@/db/schema/app";

const r = resource(habits);
export const GET = r.GET;
export const POST = r.POST;
