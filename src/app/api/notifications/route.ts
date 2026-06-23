import { resource } from "@/lib/api";
import { notifications } from "@/db/schema/app";

const r = resource(notifications);
export const GET = r.GET;
export const POST = r.POST;
