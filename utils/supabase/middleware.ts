// // utils/supabase/middleware.ts
// import { createServerClient } from '@supabase/ssr'
// import { type NextRequest, NextResponse } from 'next/server'

// export const updateSession = async (req: NextRequest) => {
//   const res = NextResponse.next()
//   const supabase = createServerClient(
//     process.env.NEXT_PUBLIC_SUPABASE_URL!,
//     process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
//     {
//       cookies: {
//         get(name: string) {
//           return req.cookies.get(name)?.value
//         },
//         set(name, value, options) {
//           res.cookies.set({ name, value, ...options })
//         },
//         remove(name, options) {
//           res.cookies.set({ name, value: '', ...options })
//         },
//       },
//     }
//   )

//   // sync session cookie
//   await supabase.auth.getSession()

//   return res
// }
