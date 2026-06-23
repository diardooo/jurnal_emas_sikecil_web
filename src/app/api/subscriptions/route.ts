import { resource } from "@/lib/api";
import { subscriptions } from "@/db/schema/app";

const r = resource(subscriptions);
export const GET = r.GET;
export const POST = r.POST;
