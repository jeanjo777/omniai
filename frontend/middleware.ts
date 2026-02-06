// OmniAI - Middleware de protection des routes
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

const protectedRoutes = ['/chat', '/image', '/video']
const authRoutes = ['/login', '/signup']

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Check for Supabase auth token in cookies
  const hasSession = request.cookies.getAll().some(
    (cookie) => cookie.name.startsWith('sb-') && cookie.name.endsWith('-auth-token')
  )

  // Redirect authenticated users away from auth pages
  if (hasSession && authRoutes.includes(pathname)) {
    return NextResponse.redirect(new URL('/chat', request.url))
  }

  // Redirect unauthenticated users to login for protected routes
  if (!hasSession && protectedRoutes.includes(pathname)) {
    const loginUrl = new URL('/login', request.url)
    loginUrl.searchParams.set('redirect', pathname)
    return NextResponse.redirect(loginUrl)
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/chat', '/image', '/video', '/login', '/signup'],
}
