import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export async function proxy(req: NextRequest) {
    if (req.nextUrl.pathname.startsWith('/dashboard')) {
        const cookie = req.cookies.get('sb-access-token')
        if (!cookie) {
            return NextResponse.redirect(new URL('/login', req.url))
        }
    }
    return NextResponse.next()
}

export const config = {
    matcher: ['/dashboard/:path*'],
}