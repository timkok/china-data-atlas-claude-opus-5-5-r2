import type { NextConfig } from "next";

// Fully static export: every page is pre-rendered HTML at build time from
// src/data/site.json and public/data/*.json. No server, no runtime scraping.
const nextConfig: NextConfig = {
  output: "export",
  trailingSlash: true,
  images: { unoptimized: true },
  turbopack: {
    rules: {
      "*.css": { loaders: ["@tailwindcss/turbopack"], as: "*.css" },
    },
  },
};

export default nextConfig;
