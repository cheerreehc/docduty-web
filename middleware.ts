// middleware.ts
import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

// ฟังก์ชันนี้จะทำหน้าที่รีเฟรช session
async function updateSession(req: NextRequest) {
  let res = NextResponse.next({
    request: {
      headers: req.headers,
    },
  })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return req.cookies.get(name)?.value
        },
        set(name: string, value: string, options: CookieOptions) {
          req.cookies.set({ name, value, ...options })
          res = NextResponse.next({
            request: {
              headers: req.headers,
            },
          })
          res.cookies.set({ name, value, ...options })
        },
        remove(name: string, options: CookieOptions) {
          req.cookies.set({ name, value: '', ...options })
          res = NextResponse.next({
            request: {
              headers: req.headers,
            },
          })
          res.cookies.set({ name, value: '', ...options })
        },
      },
    }
  )

  const { data, error } = await supabase.auth.getSession()

  const access_token = data?.session?.access_token
  if (access_token) {
    // สำคัญ: inject Authorization header ให้ Supabase รู้ว่าใครยิง
    res.headers.set('Authorization', `Bearer ${access_token}`)
    res.headers.set('X-Client-Info', 'supabase-auth-helpers')
  }

  return res
}



export async function middleware(req: NextRequest) {
  console.log('🧭 Middleware triggered', req.nextUrl.pathname)
  // ขั้นแรก, อัปเดต session ก่อนเสมอ
  const res = await updateSession(req)

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return req.cookies.get(name)?.value
        },
      },
    }
  )

  const { data: { user } } = await supabase.auth.getUser()
  const { pathname } = req.nextUrl

  // หนัาสาธารณะที่ทุกคนเข้าได้
  const publicPaths = ['/', '/signin', '/signup', '/auth/confirmed']

  // ถ้าผู้ใช้ยังไม่ล็อกอิน และกำลังพยายามเข้าถึงหน้าที่ไม่ใช่หน้าสาธารณะ
  if (!user && !publicPaths.some(path => pathname.startsWith(path))) {
    const redirectUrl = req.nextUrl.clone()
    redirectUrl.pathname = '/signin'
    redirectUrl.searchParams.set('redirectedFrom', pathname)
    return NextResponse.redirect(redirectUrl)
  }

  // ถ้าผู้ใช้ล็อกอินแล้ว และพยายามจะเข้าหน้า signin หรือ signup
  if (user && (pathname === '/signin' || pathname === '/signup')) {
    return NextResponse.redirect(new URL('/dashboard', req.url))
  }

  return res
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
  ],
}