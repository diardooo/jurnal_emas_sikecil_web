import { resource } from "@/lib/api";
import { immunizations } from "@/db/schema/app";

const r = resource(immunizations);
export const GET = r.GET;
export const POST = r.POST;
