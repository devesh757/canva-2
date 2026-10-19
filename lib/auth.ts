// Demo auth: email -> user row -> HMAC-signed session cookie. No passwords (clearly labeled demo).
import { createHmac, timingSafeEqual } from 'node:crypto';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { db } from './db';
import type { User, Subscription } from '@prisma/client';

const COOKIE = 'ls_session';
const secret = () => process.env.AUTH_SECRET || 'libre-studio-dev-secret';

function sign(payload: string) {
  return createHmac('sha256', secret()).update(payload).digest('base64url');
}

export function makeToken(userId: string, days = 30) {
  const exp = Date.now() + days * 86400000;
  const payload = `${userId}.${exp}`;
  return `${payload}.${sign(payload)}`;
}

function verifyToken(token?: string | null): string | null {
  if (!token) return null;
  const parts = token.split('.');
  if (parts.length !== 3) return null;
  const [userId, exp, sig] = parts;
  const expected = Buffer.from(sign(`${userId}.${exp}`));
  const given = Buffer.from(sig);
  const valid = expected.length === given.length && timingSafeEqual(expected, given);
  if (!valid || Number(exp) < Date.now()) return null;
  return userId;
}

export type SessionUser = User & { subscription: Subscription | null };

export async function getSessionUser(): Promise<SessionUser | null> {
  const jar = await cookies();
  const userId = verifyToken(jar.get(COOKIE)?.value);
  if (!userId) return null;
  const user = await db.user.findUnique({
    where: { id: userId },
    include: { subscription: true },
  });
  return user;
}

export async function requireUser(): Promise<SessionUser> {
  const user = await getSessionUser();
  if (!user) redirect('/login');
  return user;
}

export async function signInOrCreate(email: string): Promise<string> {
  email = email.trim().toLowerCase();
  const user = await db.user.upsert({
    where: { email },
    update: {},
    create: { email, name: email.split('@')[0] },
  });
  return user.id;
}

export async function setSessionCookie(userId: string) {
  const jar = await cookies();
  jar.set(COOKIE, makeToken(userId), {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production' && process.env.AUTH_SECRET !== 'libre-studio-dev-secret',
    maxAge: 30 * 86400,
    path: '/',
  });
}

export async function clearSessionCookie() {
  const jar = await cookies();
  jar.set(COOKIE, '', { maxAge: 0, path: '/' });
}
