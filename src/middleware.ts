import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { jwtVerify } from 'jose';

const JWT_SECRET = new TextEncoder().encode(process.env.JWT_SECRET || 'fallback-secret');

// Define protected routes
const adminRoutes = ['/admin'];
const employeeRoutes = ['/employee'];
const publicRoutes = ['/', '/login'];

export async function middleware(request: NextRequest) {
    const { pathname } = request.nextUrl;

    // Get token from cookies
    const token = request.cookies.get('auth_token')?.value;

    // Check if route is admin route
    const isAdminRoute = adminRoutes.some(route => pathname.startsWith(route));
    const isEmployeeRoute = employeeRoutes.some(route => pathname.startsWith(route));
    const isPublicRoute = publicRoutes.includes(pathname);

    // If no token and trying to access protected route
    if (!token && (isAdminRoute || isEmployeeRoute)) {
        const url = request.nextUrl.clone();
        url.pathname = '/';
        return NextResponse.redirect(url);
    }

    // Verify token and check role
    if (token) {
        try {
            const { payload } = await jwtVerify(token, JWT_SECRET);
            const role = payload.role as string;

            // If admin trying to access employee routes, redirect to admin
            if (role === 'ADMIN' && isEmployeeRoute) {
                const url = request.nextUrl.clone();
                url.pathname = '/admin';
                return NextResponse.redirect(url);
            }

            // If employee trying to access admin routes, redirect to employee
            if (role === 'EMPLOYEE' && isAdminRoute) {
                const url = request.nextUrl.clone();
                url.pathname = '/employee';
                return NextResponse.redirect(url);
            }

            // If logged in and trying to access login page, redirect based on role
            if (pathname === '/' || pathname === '/login') {
                const url = request.nextUrl.clone();
                url.pathname = role === 'ADMIN' ? '/admin' : '/employee';
                return NextResponse.redirect(url);
            }
        } catch (error) {
            // Invalid token, clear it and redirect to login
            console.error('Token verification failed:', error);
            const response = NextResponse.redirect(new URL('/', request.url));
            response.cookies.delete('auth_token');
            return response;
        }
    }

    // Add security headers
    const response = NextResponse.next();
    response.headers.set('X-Frame-Options', 'DENY');
    response.headers.set('X-Content-Type-Options', 'nosniff');
    response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');

    // Prevent caching for protected routes
    if (isAdminRoute || isEmployeeRoute) {
        response.headers.set('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
        response.headers.set('Pragma', 'no-cache');
        response.headers.set('Expires', '0');
    }

    return response;
}

// Configure which routes to run middleware on
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
};
