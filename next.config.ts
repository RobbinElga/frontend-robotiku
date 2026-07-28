import type { NextConfig } from "next";

const isDev = process.env.NODE_ENV === "development";

const nextConfig: NextConfig = {
  output: "standalone",
  ...(isDev
    ? {
      async rewrites() {
        return [
          { source: "/api/:path*", destination: "http://localhost:8000/api/:path*" },
          { source: "/storage/:path*", destination: "http://localhost:8000/storage/:path*" },
        ];
      },
      allowedDevOrigins: ["https://6gjbc12h-3000.asse.devtunnels.ms"],
    }
    : {}),
};

export default nextConfig;
