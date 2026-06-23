import { resource } from "@/lib/api";
import { sleepLogs } from "@/db/schema/app";

const r = resource(sleepLogs);
export const GET = r.GET;
export const POST = r.POST;
