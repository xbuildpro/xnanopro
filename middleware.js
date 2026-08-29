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
  // The studios run inside an iframe on everything-possible.com, so ep_session
  // is a third-party cookie. Safari blocks those outright and Chrome is
  // retiring them, which left the cookie unset and every request bounced. The
  // token is therefore also accepted from the Authorization header, which no
  // browser strips.
  const header = request.headers.get('authorization') || '';
  const bearer = header.toLowerCase().startsWith('bearer ') ? header.slice(7).trim() : '';

  if (bearer && await validToken(bearer)) {
    return NextResponse.next();
  }

  if (supplied && await validToken(supplied)) {
    // Let the page render with the token still in the URL so the client can
    // pick it up and use it for its API calls. Redirecting it away only worked
    // when the cookie survived, which is exactly what could not be relied on.
    const response = NextResponse.next();
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
    '/api/gallery/:path*',
  ],
};
