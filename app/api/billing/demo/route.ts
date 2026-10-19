import { NextResponse } from 'next/server';
import { getSessionUser } from '@/lib/auth';
import { db } from '@/lib/db';
import { PLANS } from '@/lib/pricing';
import { stripeConfigured } from '@/lib/billing';

// Demo billing: flips the subscription row without payment. Never exposed when
// Stripe is configured — real cards then flow through /api/billing/checkout.
export async function POST(req: Request) {
  if (stripeConfigured()) {
    return NextResponse.json({ error: 'Stripe configured — use real checkout' }, { status: 400 });
  }
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: 'Sign in first' }, { status: 401 });

  const { plan } = await req.json().catch(() => ({ plan: '' }));
  const def = PLANS.find((p) => p.id === plan);
  if (!def) return NextResponse.json({ error: 'Unknown plan' }, { status: 400 });

  const periodEnd = new Date(Date.now() + 30 * 86400000);
  const sub = await db.subscription.upsert({
    where: { userId: user.id },
    update: { plan: def.id, status: def.id === 'FREE' ? 'ACTIVE' : 'DEMO', currentPeriodEnd: periodEnd },
    create: { userId: user.id, plan: def.id, status: def.id === 'FREE' ? 'ACTIVE' : 'DEMO', currentPeriodEnd: periodEnd },
  });
  return NextResponse.json({ ok: true, plan: sub.plan, status: sub.status });
}
