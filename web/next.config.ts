import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // API routing handled by route.ts handler in src/app/api/[...path]/
  trailingSlash: false,
};

export default nextConfig;
