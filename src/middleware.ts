import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { updateSession } from '@/lib/supabase/middleware'

// Routes that don't require authentication
const PUBLIC_ROUTES = [
    '/home',
    '/login',
    '/waitlist',
    '/privacy',
    '/terms',
    '/api/auth',
]

function isPublicRoute(pathname: string) {
    return PUBLIC_ROUTES.some(route => pathname.startsWith(route))
}

export async function middleware(request: NextRequest) {
    const { pathname } = request.nextUrl

    // Always set x-pathname for use in layouts
    const requestHeaders = new Headers(request.headers)
    requestHeaders.set('x-pathname', pathname)

    // Refresh session and get user
    const { supabaseResponse, user } = await updateSession(request)

    // Copy x-pathname to the supabase response headers
    supabaseResponse.headers.set('x-pathname', pathname)

    // If visiting root, redirect to appropriate page
    if (pathname === '/') {
        const redirectUrl = user ? '/system/control-centre' : '/home'
        return NextResponse.redirect(new URL(redirectUrl, request.url))
    }

    // Allow public routes through
    if (isPublicRoute(pathname)) {
        // If already logged in and visiting login, go to app
        if (pathname === '/login' && user) {
            return NextResponse.redirect(new URL('/system/control-centre', request.url))
        }
        return supabaseResponse
    }

    // Protected route: no user → redirect to login
    if (!user) {
        const loginUrl = new URL('/login', request.url)
        loginUrl.searchParams.set('redirectTo', pathname)
        return NextResponse.redirect(loginUrl)
    }

    return supabaseResponse
}

export const config = {
    matcher: [
        '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
    ],
}
