import type { MetadataRoute } from "next";
import { INDICATORS, PROVINCES, SITE, SITE_URL } from "@/lib/data";
export const dynamic = "force-static";
export default function sitemap(): MetadataRoute.Sitemap {
  const base = SITE_URL || "http://localhost:3000";
  const paths = ["/", "/indicators/", "/provinces/", "/compare/", "/explorer/", "/stories/", "/ask/", "/quality/", "/map/", "/methodology/", "/about/",
    ...INDICATORS.map((i) => `/indicators/${i.id}/`), ...PROVINCES.map((p) => `/provinces/${p.geo_code}/`), ...SITE.stories.map((s) => `/stories/${s.slug}/`)];
  return paths.map((p) => ({ url: base + p, changeFrequency: "monthly", priority: p === "/" ? 1 : 0.7 }));
}
