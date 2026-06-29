import { redirect } from "next/navigation";

// Routines merged into "Catatan si Kecil" › tab "Rutinitas & Kebiasaan". Keep
// this route as a redirect so old links/bookmarks/deep links don't break.
export default function RoutinesRedirect() {
  redirect("/catatan?tab=rutinitas");
}
