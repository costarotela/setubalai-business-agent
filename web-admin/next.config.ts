import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  // API proxying handled by route.ts in src/app/api/[...path]/
  // No rewrites needed
};

export default nextConfig;
