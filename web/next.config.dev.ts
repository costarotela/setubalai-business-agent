import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  allowedDevOrigins: [
    'localhost',
    '100.72.101.29',
    '135.181.86.129',
  ],
  async rewrites() {
    return [
      {
        source: "/api/:path*",
        destination: "http://100.72.101.29:3010/:path*",
      },
    ];
  },
};

export default nextConfig;
