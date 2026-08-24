import { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: ["/admin/", "/api/", "/auth/", "/advertiser/", "/employer/", "/student/", "/dashboard/"],
    },
    sitemap: "https://www.elimux.ke/sitemap.xml",
  };
}
