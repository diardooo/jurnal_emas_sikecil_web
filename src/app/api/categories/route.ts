import { resource } from "@/lib/api";
import { categories } from "@/db/schema/app";

const r = resource(categories);
export const GET = r.GET;
export const POST = r.POST;
