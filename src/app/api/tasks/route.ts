import { resource } from "@/lib/api";
import { tasks } from "@/db/schema/app";

const r = resource(tasks);
export const GET = r.GET;
export const POST = r.POST;
