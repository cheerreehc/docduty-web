// utils/supabase/server.ts
import { createServerClient } from '@supabase/ssr'
import type { GetServerSidePropsContext } from 'next'

export function createServerSupabaseClient(ctx: GetServerSidePropsContext) {
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return ctx.req.cookies[name]
        },
      },
    }
  )
}
