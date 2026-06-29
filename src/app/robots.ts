import type { MetadataRoute } from "next";
import { siteUrl } from "@/lib/site";

// Allow crawling of the public marketing pages; keep the API, admin, and all
// authenticated app routes (private child data) out of search engines.
export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: [
          "/api/",
          "/admin",
          "/dashboard",
          "/coach",
          "/journal",
          "/growth",
          "/goals",
          "/catatan",
          "/tasks",
          "/routines",
          "/children",
          "/reports",
          "/settings",
          "/onboarding",
          "/r/",
        ],
      },
    ],
    sitemap: `${siteUrl}/sitemap.xml`,
    host: siteUrl,
  };
}
