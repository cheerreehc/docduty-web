import type { NextConfig } from "next";

const isProd = process.env.NODE_ENV === 'production';

const nextConfig: NextConfig = {
  reactStrictMode: true,
  eslint: {
    ignoreDuringBuilds: true,
  },
  ...(isProd && {
    output: 'export',
  }),
  images: {
    domains: ['pqnmfikncumnshlbgsmz.supabase.co'], // ✅ ใส่โดเมนของ supabase ที่ใช้ storage
  },
};

export default nextConfig;
