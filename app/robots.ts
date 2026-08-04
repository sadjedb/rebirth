import type { MetadataRoute } from "next";
import { brand } from "@/config/brand";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: ["/cart", "/checkout", "/account", "/order-confirmation", "/api"],
    },
    sitemap: `https://${brand.domain}/sitemap.xml`,
  };
}
