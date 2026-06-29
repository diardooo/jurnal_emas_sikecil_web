import { redirect } from "next/navigation";

// Task Manager merged into "Catatan si Kecil" › tab "PR Ibu". Keep this route as
// a redirect so old links/bookmarks/deep links don't break.
export default function TasksRedirect() {
  redirect("/catatan?tab=pr");
}
