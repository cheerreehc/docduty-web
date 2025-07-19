// middleware.ts
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl
  // ใช้ชื่อ cookie ที่ถูกต้องของ Supabase v2
  const accessToken = req.cookies.get('sb-access-token')?.value 

  const protectedPaths = ['/dashboard', '/profile', '/calendar', '/dutytype']
  const isProtected = protectedPaths.some((path) => pathname.startsWith(path))

  // เอา comment ส่วนนี้ออกเพื่อเปิดใช้งาน
  if (isProtected && !accessToken) {
    const redirectUrl = req.nextUrl.clone()
    redirectUrl.pathname = '/signin'
    redirectUrl.searchParams.set('redirectedFrom', pathname)
    return NextResponse.redirect(redirectUrl)
  }

  return NextResponse.next()
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