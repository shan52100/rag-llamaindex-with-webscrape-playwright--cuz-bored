import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "export",   // static HTML export for Render / Netlify / any CDN
  trailingSlash: true,
};

export default nextConfig;
