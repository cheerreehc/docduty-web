// lib/supabase.ts
import { createBrowserClient, createServerClient } from '@supabase/ssr';
import type { SupabaseClient } from '@supabase/supabase-js';
import type { NextApiRequest, NextApiResponse } from 'next';

// ✅ ถ้ามี Database type ให้ import มาแทน 'any'
type Database = any;

// สำหรับฝั่ง client (browser)
export function createSupabaseClient(rememberMe = true): SupabaseClient<Database> {
  const isBrowser = typeof window !== 'undefined';

  return createBrowserClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      auth: {
        storage: isBrowser
          ? rememberMe
            ? localStorage
            : sessionStorage
          : undefined, // บน server ยังไม่ใช้ storage
        persistSession: true,
        autoRefreshToken: true,
      },
    }
  );
}

// สำหรับ server-side เช่น getServerSideProps
export function createSupabaseServerClient(
  req: NextApiRequest,
  res: NextApiResponse
): SupabaseClient<Database> {
  return createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get: (key) => req.cookies[key],
        set: (key, value, options) => {
          const cookie = `${key}=${value}; Path=/; HttpOnly; SameSite=Lax`;
          res.setHeader('Set-Cookie', cookie);
        },
        remove: (key) => {
          const cookie = `${key}=; Path=/; Max-Age=0; HttpOnly; SameSite=Lax`;
          res.setHeader('Set-Cookie', cookie);
        },
      },
    }
  );
}
