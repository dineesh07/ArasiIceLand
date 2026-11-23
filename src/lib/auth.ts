import { cookies } from 'next/headers';
import bcrypt from 'bcryptjs';
import { queryOne } from './db';

const SECRET_KEY = process.env.JWT_SECRET || 'shop-manager-super-secure-secret-key-2026-ist';
export const AUTH_COOKIE_NAME = 'shop_manager_session';

export interface AppUser {
  id: string;
  email: string;
  name: string;
  role: string;
}

async function getCryptoKey(): Promise<CryptoKey> {
  const enc = new TextEncoder();
  return await crypto.subtle.importKey(
    'raw',
    enc.encode(SECRET_KEY),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign', 'verify']
  );
}

function base64UrlEncode(str: string): string {
  return Buffer.from(str)
    .toString('base64')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');
}

function base64UrlDecode(str: string): string {
  let base64 = str.replace(/-/g, '+').replace(/_/g, '/');
  while (base64.length % 4) {
    base64 += '=';
  }
  return Buffer.from(base64, 'base64').toString();
}

export async function createSessionToken(user: AppUser): Promise<string> {
  const key = await getCryptoKey();
  const enc = new TextEncoder();
  const header = base64UrlEncode(JSON.stringify({ alg: 'HS256', typ: 'JWT' }));
  const payload = base64UrlEncode(
    JSON.stringify({
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      exp: Date.now() + 30 * 24 * 60 * 60 * 1000, // 30 days
    })
  );

  const sigBuffer = await crypto.subtle.sign('HMAC', key, enc.encode(`${header}.${payload}`));
  const signature = Buffer.from(sigBuffer)
    .toString('base64')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');

  return `${header}.${payload}.${signature}`;
}

export async function verifySessionToken(token: string): Promise<AppUser | null> {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return null;
    const [header, payloadStr, signatureStr] = parts;
    const key = await getCryptoKey();
    const enc = new TextEncoder();

    // Decode signature
    let sigBase64 = signatureStr.replace(/-/g, '+').replace(/_/g, '/');
    while (sigBase64.length % 4) {
      sigBase64 += '=';
    }
    const sigBytes = Buffer.from(sigBase64, 'base64');

    const isValid = await crypto.subtle.verify(
      'HMAC',
      key,
      sigBytes,
      enc.encode(`${header}.${payloadStr}`)
    );

    if (!isValid) return null;

    const payload = JSON.parse(base64UrlDecode(payloadStr));
    if (payload.exp && Date.now() > payload.exp) return null;

    return {
      id: payload.id,
      email: payload.email,
      name: payload.name,
      role: payload.role || 'owner',
    };
  } catch {
    return null;
  }
}

export async function verifyUserCredentials(email: string, password: string): Promise<AppUser | null> {
  const user = await queryOne<{
    id: string;
    email: string;
    password_hash: string;
    name: string;
    role: string;
  }>('select id, email, password_hash, name, role from app_users where lower(email) = lower($1)', [email]);

  if (!user) return null;

  const valid = await bcrypt.compare(password, user.password_hash);
  if (!valid) return null;

  return {
    id: user.id,
    email: user.email,
    name: user.name,
    role: user.role,
  };
}

export async function getCurrentUser(): Promise<AppUser | null> {
  const cookieStore = cookies();
  const token = cookieStore.get(AUTH_COOKIE_NAME)?.value;
  if (!token) return null;
  return await verifySessionToken(token);
}
