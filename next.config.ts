import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    // Media uploads use Storage directly. This protects other large form
    // submissions and leaves ample room for multipart overhead.
    serverActions: {
      bodySizeLimit: "100mb",
    },
  },
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "yzivkrotylwyglavtnho.supabase.co",
        pathname: "/storage/v1/object/public/**",
      },
      {
        protocol: "https",
        hostname: "framerusercontent.com",
        pathname: "/images/**",
      },
    ],
  },
  typedRoutes: true,
};

export default nextConfig;
