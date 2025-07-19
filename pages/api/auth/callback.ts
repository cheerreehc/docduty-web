import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { type NextApiRequest, type NextApiResponse } from 'next'

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const { code } = req.query

  if (typeof code === 'string') {
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          get(name: string) {
            return req.cookies[name]
          },
          set(name: string, value: string, options: CookieOptions) {
            // This is a simplified way to set cookies for API Routes.
            // You might need a more robust solution using the `cookie` package
            // if you need to handle more complex options.
            let cookieString = `${name}=${value}; Path=${options.path}; Max-Age=${options.maxAge}; SameSite=${options.sameSite}; HttpOnly=${options.httpOnly}`;
            if (options.secure) {
              cookieString += '; Secure';
            }
            res.setHeader('Set-Cookie', cookieString)
          },
          remove(name: string, options: CookieOptions) {
            let cookieString = `${name}=; Path=${options.path}; Max-Age=0; SameSite=${options.sameSite}; HttpOnly=${options.httpOnly}`;
            if (options.secure) {
              cookieString += '; Secure';
            }
            res.setHeader('Set-Cookie', cookieString)
          },
        },
      }
    )
    const { error } = await supabase.auth.exchangeCodeForSession(code)
    if (!error) {
      // By default, redirect to the dashboard after a successful login.
      return res.redirect('/auth/confirmed')
    }
  }

  // Redirect to an error page if there's an issue.
  res.redirect('/login?error=Could not authenticate user')
}