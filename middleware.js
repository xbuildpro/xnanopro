import { NextResponse } from 'next/server';

const SUPABASE_URL = 'https://jkewqiqkenjavtbgxuip.supabase.co';
const SUPABASE_KEY = 'sb_publishable_ubS1IdiaCZPMV1vEm-zdlw_06Quiqfm';

async function validToken(token) {
  if (!token) return false;
  try {
    const response = await fetch(`${SUPABASE_URL}/auth/v1/user`, {
      headers: {
        apikey: SUPABASE_KEY,
        Authorization: `Bearer ${token}`,
      },
      cache: 'no-store',
    });
    return response.ok;
  } catch {
    return false;
  }
}

export async function middleware(request) {
  const url = request.nextUrl;
  const supplied = url.searchParams.get('ep_token');
  const cookieToken = request.cookies.get('ep_session')?.value;

  if (supplied && await validToken(supplied)) {
    const cleanUrl = url.clone();
    cleanUrl.searchParams.delete('ep_token');
    const response = NextResponse.redirect(cleanUrl);
    response.cookies.set('ep_session', supplied, {
      httpOnly: true,
      secure: true,
      sameSite: 'none',
      path: '/',
      maxAge: 60 * 60,
    });
    return response;
  }

  if (cookieToken && await validToken(cookieToken)) {
    return NextResponse.next();
  }

  if (url.pathname.startsWith('/api/')) {
    return NextResponse.json({ message: 'Log in to Everything Possible to use this app.' }, { status: 401 });
  }

  return NextResponse.redirect('https://www.everything-possible.com/');
}

export const config = {
  matcher: [
    '/studio/:path*',
    '/api/generate',
    '/api/video',
    '/api/vton',
    '/api/kolors',
  ],
};
