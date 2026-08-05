import { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: ["/admin/", "/api/", "/student/", "/employer/", "/dashboard/"],
    },
    sitemap: "https://www.elimux.ke/sitemap.xml",
  };
}
