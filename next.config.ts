import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    serverActions: {
      // Default is 1MB — product photos/video routinely exceed that.
      bodySizeLimit: "15mb",
    },
  },
};

export default nextConfig;
