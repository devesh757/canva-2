import { NextResponse } from 'next/server';
import { clearSessionCookie, getSessionUser, setSessionCookie, signInOrCreate } from '@/lib/auth';

export async function POST(req: Request) {
  const { email } = await req.json().catch(() => ({ email: '' }));
  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return NextResponse.json({ error: 'Enter a valid email address' }, { status: 400 });
  }
  const userId = await signInOrCreate(email);
  await setSessionCookie(userId);
  return NextResponse.json({ ok: true });
}

export async function DELETE() {
  await clearSessionCookie();
  return NextResponse.json({ ok: true });
}

export async function GET() {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ user: null });
  return NextResponse.json({
    user: { id: user.id, email: user.email, name: user.name },
  });
}
