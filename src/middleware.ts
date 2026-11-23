import { NextResponse, type NextRequest } from 'next/server';

const AUTH_COOKIE_NAME = 'shop_manager_session';
const SECRET_KEY = process.env.JWT_SECRET || 'shop-manager-super-secure-secret-key-2026-ist';

async function verifyEdgeToken(token: string): Promise<boolean> {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return false;
    const [header, payloadStr, signatureStr] = parts;

    const enc = new TextEncoder();
    const key = await crypto.subtle.importKey(
      'raw',
      enc.encode(SECRET_KEY),
      { name: 'HMAC', hash: 'SHA-256' },
      false,
      ['verify']
    );

    let base64 = signatureStr.replace(/-/g, '+').replace(/_/g, '/');
    while (base64.length % 4) {
      base64 += '=';
    }
    const binStr = atob(base64);
    const sigBytes = new Uint8Array(binStr.length);
    for (let i = 0; i < binStr.length; i++) {
      sigBytes[i] = binStr.charCodeAt(i);
    }

    const isValid = await crypto.subtle.verify(
      'HMAC',
      key,
      sigBytes,
      enc.encode(`${header}.${payloadStr}`)
    );

    if (!isValid) return false;

    let payBase64 = payloadStr.replace(/-/g, '+').replace(/_/g, '/');
    while (payBase64.length % 4) {
      payBase64 += '=';
    }
    const payload = JSON.parse(atob(payBase64));
    if (payload.exp && Date.now() > payload.exp) return false;

    return true;
  } catch {
    return false;
  }
}

export async function middleware(request: NextRequest) {
  const token = request.cookies.get(AUTH_COOKIE_NAME)?.value;
  const isAuthenticated = token ? await verifyEdgeToken(token) : false;

  const { pathname } = request.nextUrl;
  const isLoginPage = pathname === '/login';
  const isAuthApi = pathname.startsWith('/api/auth');

  if (isAuthApi) {
    return NextResponse.next();
  }

  // If unauthenticated and trying to access protected routes
  if (!isAuthenticated && !isLoginPage) {
    const url = request.nextUrl.clone();
    url.pathname = '/login';
    return NextResponse.redirect(url);
  }

  // If already authenticated and trying to visit /login
  if (isAuthenticated && isLoginPage) {
    const url = request.nextUrl.clone();
    url.pathname = '/';
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|json|js|woff|woff2|ttf|otf)$).*)',
  ],
};
