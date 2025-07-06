import { createBrowserClient } from '@supabase/ssr';
import { createClient } from '@supabase/supabase-js';

export function createSupabaseClient(rememberMe: boolean) {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      auth: {
        storage: rememberMe ? localStorage : sessionStorage,
        persistSession: true,
        autoRefreshToken: true,
      },
    }
  );
}
