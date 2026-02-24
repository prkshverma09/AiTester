import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

const dashboardParentPrefix = '/dashboard/parent'
const dashboardStudentPrefix = '/dashboard/student'

export async function middleware(request: NextRequest) {
  let response = NextResponse.next({ request })

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  if (!supabaseUrl || !supabaseAnonKey) {
    return response
  }

  const supabase = createServerClient(supabaseUrl, supabaseAnonKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll()
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
        response = NextResponse.next({ request })
        cookiesToSet.forEach(({ name, value, options }) =>
          response.cookies.set(name, value, options)
        )
      },
    },
  })

  const { data } = await supabase.auth.getClaims()
  const user = data?.claims
  const pathname = request.nextUrl.pathname

  const isDashboardParent = pathname === dashboardParentPrefix || pathname.startsWith(`${dashboardParentPrefix}/`)
  const isDashboardStudent = pathname === dashboardStudentPrefix || pathname.startsWith(`${dashboardStudentPrefix}/`)

  if (isDashboardParent || isDashboardStudent) {
    if (!user?.sub) {
      const loginPath = isDashboardParent ? '/login/parent' : '/login/student'
      const url = request.nextUrl.clone()
      url.pathname = loginPath
      return NextResponse.redirect(url)
    }
  }

  return response
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
