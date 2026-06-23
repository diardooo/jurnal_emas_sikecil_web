import { resource } from "@/lib/api";
import { todos } from "@/db/schema/app";

const r = resource(todos);
export const GET = r.GET;
export const POST = r.POST;
