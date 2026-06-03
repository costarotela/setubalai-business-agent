import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  allowedDevOrigins: [
    'localhost',
    '100.72.101.29',
    '135.181.86.129',
    'dev.setubalai.org',
  ],
  // NO rewrites here — API proxy is handled by src/app/api/[...path]/route.ts
  // which properly follows 307 redirects server-side without exposing backend IPs to the browser
};

export default nextConfig;
