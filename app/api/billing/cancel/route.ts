import { NextResponse } from 'next/server';
import { getSessionUser } from '@/lib/auth';
import { db } from '@/lib/db';

// Cancel: demo mode drops to Free immediately; with Stripe (future) this would
// reroute to the billing portal so Stripe owns the lifecycle.
export async function POST() {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: 'Sign in first' }, { status: 401 });

  await db.subscription.upsert({
    where: { userId: user.id },
    update: { plan: 'FREE', status: 'ACTIVE' },
    create: { userId: user.id, plan: 'FREE', status: 'ACTIVE' },
  });
  return NextResponse.json({ ok: true, plan: 'FREE' });
}
