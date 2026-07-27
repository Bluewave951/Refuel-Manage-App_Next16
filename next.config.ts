import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  devIndicators: false,   // ← เพิ่มบรรทัดนี้
  experimental: {
    typedRoutes: true,
  },
  serverExternalPackages: ["@prisma/client"],
};

export default nextConfig;
