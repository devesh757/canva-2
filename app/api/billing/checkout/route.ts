import { NextResponse } from 'next/server';
import { getSessionUser } from '@/lib/auth';
import { getStripe, stripePriceIds, appUrl, stripeConfigured } from '@/lib/billing';
import { db } from '@/lib/db';
import { PLANS } from '@/lib/pricing';

// Real Stripe checkout when STRIPE_SECRET_KEY is set; otherwise a clear pointer to demo activation.
export async function POST(req: Request) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: 'Sign in first' }, { status: 401 });

  const { plan } = await req.json().catch(() => ({ plan: '' }));
  const def = PLANS.find((p) => p.id === plan && p.id !== 'FREE');
  if (!def) return NextResponse.json({ error: 'Pick the Pro or Max plan' }, { status: 400 });

  const stripe = getStripe();
  if (!stripe) {
    return NextResponse.json(
      { error: 'Stripe not configured (STRIPE_SECRET_KEY missing). Add keys, or use demo activation.', demoOnly: true },
      { status: 503 },
    );
  }

  if (!user.stripeCustomerId) {
    const customer = await stripe.customers.create({ email: user.email, metadata: { userId: user.id } });
    await db.user.update({ where: { id: user.id }, data: { stripeCustomerId: customer.id } });
    user.stripeCustomerId = customer.id;
  }

  const prices = stripePriceIds();
  const pid = def.id === 'PRO' ? prices.PRO : prices.MAX;
  const line_item = pid
    ? { price: pid, quantity: 1 }
    : { quantity: 1, price_data: { currency: 'usd', unit_amount: def.price * 100, recurring: { interval: 'month' as const }, product_data: { name: `Libre Studio ${def.name}` } } };

  const base = appUrl(req);
  const session = await stripe.checkout.sessions.create({
    mode: 'subscription',
    customer: user.stripeCustomerId!,
    line_items: [line_item],
    success_url: `${base}/account?checkout=success`,
    cancel_url: `${base}/pricing?checkout=cancel`,
    metadata: { userId: user.id, plan: def.id },
  });

  return NextResponse.json({ url: session.url });
}
