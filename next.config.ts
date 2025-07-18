import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  eslint: {
    ignoreDuringBuilds: true,
  },
  images: {
    // ใส่โดเมนของ supabase ที่ใช้ storage
    domains: ['pqnmfikncumnshlbgsmz.supabase.co'], 
  },
};

export default nextConfig;