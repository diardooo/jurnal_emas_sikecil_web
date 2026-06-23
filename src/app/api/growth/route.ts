import { resource } from "@/lib/api";
import { growthRecords } from "@/db/schema/app";

const r = resource(growthRecords);
export const GET = r.GET;
export const POST = r.POST;
