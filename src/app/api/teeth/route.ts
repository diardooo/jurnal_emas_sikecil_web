import { resource } from "@/lib/api";
import { teeth } from "@/db/schema/app";

const r = resource(teeth);
export const GET = r.GET;
export const POST = r.POST;
