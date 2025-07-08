import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  reactStrictMode: true,
  eslint: {
    ignoreDuringBuilds: true, // ✅ ปิด eslint ตอน build
  },
  output: 'export', // ✅ เพิ่มตรงนี้เพื่อใช้ static export
};

export default nextConfig;
