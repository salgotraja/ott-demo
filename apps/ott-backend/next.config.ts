import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  serverExternalPackages: ["@prisma/client", "@prisma/adapter-pg", "pg", "ioredis"],
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "image.tmdb.org",
        pathname: "**",
      },
      {
        protocol: "https",
        hostname: "img.youtube.com",
        pathname: "**",
      },
    ],
  },
};

export default nextConfig;
