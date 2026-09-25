import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export function proxy(request: NextRequest) {
  const sessionToken =
    request.cookies.get('authjs.session-token')?.value ||
    request.cookies.get('__Secure-authjs.session-token')?.value

  const isLoggedIn = !!sessionToken
  const pathname = request.nextUrl.pathname
  const isLoginPage = pathname.startsWith('/login')
  const isPublic = pathname.startsWith('/api/auth') || pathname.startsWith('/api/migrate') || pathname.startsWith('/api/debug') || pathname.startsWith('/_next') || pathname === '/favicon.ico'

  if (isPublic) return NextResponse.next()

  if (!isLoggedIn && !isLoginPage) {
    return NextResponse.redirect(new URL('/login', request.url))
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
}
