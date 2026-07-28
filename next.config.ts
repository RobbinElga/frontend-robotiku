import type { NextConfig } from "next";

const nextConfig = {
  async rewrites() {
    return [
      { source: "/api/:path*", destination: "http://localhost:8000/api/:path*" },
      { source: "/storage/:path*", destination: "http://localhost:8000/storage/:path*" },
    ];
  },
  // isi dengan host tunnel-mu nanti (lihat langkah 4), mis. "xxxx-3000.asse.devtunnels.ms"
  allowedDevOrigins: ["https://6gjbc12h-3000.asse.devtunnels.ms/"],
};

export default nextConfig;