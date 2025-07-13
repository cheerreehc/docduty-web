// middleware.ts
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl
  const accessToken = req.cookies.get('sb-access-token')?.value

  const protectedPaths = ['/dashboard', '/profile', '/calendar']
  const isProtected = protectedPaths.some((path) => pathname.startsWith(path))

  // if (isProtected && !accessToken) {
  //   const redirectUrl = req.nextUrl.clone()
  //   redirectUrl.pathname = '/signin'
  //   redirectUrl.searchParams.set('redirectedFrom', pathname)
  //   return NextResponse.redirect(redirectUrl)
  // }

  return NextResponse.next()
}

export const config = {
  matcher: ['/dashboard', '/profile', '/calendar'],
}

// // middleware.ts
// import { NextResponse } from 'next/server'
// import type { NextRequest } from 'next/server'

// export function middleware(req: NextRequest) {
//   const { nextUrl, cookies } = req
//   const token = cookies.get('sb-access-token')?.value

//   const protectedPaths = ['/dashboard', '/profile', '/calendar']
//   const isProtected = protectedPaths.includes(nextUrl.pathname)

//   if (isProtected && !token) {
//     const redirectUrl = nextUrl.clone()
//     redirectUrl.pathname = '/signin'
//     redirectUrl.searchParams.set('redirectedFrom', nextUrl.pathname)
//     return NextResponse.redirect(redirectUrl)
//   }

//   return NextResponse.next()
// }

// export const config = {
//   matcher: ['/dashboard', '/profile', '/calendar'],
// }
