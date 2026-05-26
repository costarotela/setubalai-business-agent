import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // No trailing slashes — FastAPI will 308 but proxy redirects follow it
};

export default nextConfig;
