import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request,
  })

  const host = request.headers.get('host') || ''
  const configuredDomain = process.env.AUTH_COOKIE_DOMAIN // e.g. .bootsandhoneyfarm.com
  const shouldSetDomain = Boolean(configuredDomain && host.endsWith(configuredDomain.replace(/^\./, '')))

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
          supabaseResponse = NextResponse.next({
            request,
          })
          cookiesToSet.forEach(({ name, value, options }) => {
            const finalOptions = { ...options }
            if (shouldSetDomain && configuredDomain) {
              finalOptions.domain = configuredDomain
              finalOptions.secure = true
              // Lax works well across subdomains without CSRF issues for top-level navigations
              finalOptions.sameSite = 'lax'
            }
            supabaseResponse.cookies.set(name, value, finalOptions)
          })
        },
      },
    }
  )

  // Do not run code between createServerClient and
  // supabase.auth.getUser(). A simple mistake could make it very hard to debug
  // issues with users being randomly logged out.

  // IMPORTANT: DO NOT REMOVE auth.getUser()

  // Get user session (required for session maintenance)
  await supabase.auth.getUser()

  return supabaseResponse
}
