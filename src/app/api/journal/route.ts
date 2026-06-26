import { resource } from "@/lib/api";
import { journalEntries } from "@/db/schema/app";

const r = resource(journalEntries);
export const GET = r.GET;
export const POST = r.POST;
