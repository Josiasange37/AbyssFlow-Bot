import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

// Routes qui nécessitent une authentification
const protectedRoutes = ['/dashboard']

// Routes qui nécessitent un plan payant
const premiumRoutes = ['/dashboard/broadcast', '/dashboard/premium']

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl
  
  // Vérifier si la route est protégée
  const isProtectedRoute = protectedRoutes.some(route => pathname.startsWith(route))
  const isPremiumRoute = premiumRoutes.some(route => pathname.startsWith(route))
  
  // Récupérer le token d'authentification (simulé pour l'instant)
  const token = request.cookies.get('auth-token')?.value
  const userPlan = request.cookies.get('user-plan')?.value || 'free'
  
  // Rediriger vers login si pas authentifié
  if (isProtectedRoute && !token) {
    const loginUrl = new URL('/login', request.url)
    loginUrl.searchParams.set('redirect', pathname)
    return NextResponse.redirect(loginUrl)
  }
  
  // Rediriger vers upgrade si plan insuffisant
  if (isPremiumRoute && userPlan === 'free') {
    const upgradeUrl = new URL('/dashboard/upgrade', request.url)
    return NextResponse.redirect(upgradeUrl)
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
