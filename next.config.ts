import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  trailingSlash: true,
  devIndicators: false,
  images: {
    formats: ["image/avif", "image/webp"],
    remotePatterns: [
      {
        protocol: "https",
        hostname: "http2.mlstatic.com",
      },
      {
        protocol: "https",
        hostname: "images.tcdn.com.br",
      },
      {
        protocol: "https",
        hostname: "a-static.mlcdn.com.br",
      }
    ],
  },
  poweredByHeader: false,
  compress: true,
};

export default nextConfig;
