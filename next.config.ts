import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "images.unsplash.com",
      },
    ],
  },
  async rewrites() {
    return [
      { source: "/pitch", destination: "/pitch/index.html" },
      { source: "/pitch/", destination: "/pitch/index.html" },
      { source: "/pitch/ar", destination: "/pitch/ar/index.html" },
      { source: "/pitch/ar/", destination: "/pitch/ar/index.html" },
      { source: "/pitch/fr", destination: "/pitch/fr/index.html" },
      { source: "/pitch/fr/", destination: "/pitch/fr/index.html" },
    ];
  },
};

export default nextConfig;
