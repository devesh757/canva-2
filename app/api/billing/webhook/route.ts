import { NextResponse } from 'next/server';
import type Stripe from 'stripe';
import { getStripe } from '@/lib/billing';
import { db } from '@/lib/db';

// Stripe webhook → keeps the Subscription row truthful.
// Configure: STRIPE_WEBHOOK_SECRET, endpoint → /api/billing/webhook.
export async function POST(req: Request) {
  const stripe = getStripe();
  const secret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!stripe || !secret) return NextResponse.json({ error: 'Webhooks not configured' }, { status: 503 });

  const body = await req.text();
  const sig = req.headers.get('stripe-signature') || '';
  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(body, sig, secret);
  } catch (e) {
    return NextResponse.json({ error: `Invalid signature: ${(e as Error).message}` }, { status: 400 });
  }

  switch (event.type) {
    case 'checkout.session.completed': {
      const s = event.data.object as Stripe.Checkout.Session;
      const userId = s.metadata?.userId;
      const plan = s.metadata?.plan || 'PRO';
      if (userId && s.subscription) {
        const sub = await stripe.subscriptions.retrieve(String(s.subscription));
        await db.subscription.upsert({
          where: { userId },
          update: {
            plan,
            status: sub.status === 'active' ? 'ACTIVE' : sub.status.toUpperCase(),
            stripeCustomerId: String(s.customer || ''),
            stripeSubscription: sub.id,
            currentPeriodEnd: new Date(sub.current_period_end * 1000),
          },
          create: { userId, plan, status: 'ACTIVE', stripeCustomerId: String(s.customer || ''), stripeSubscription: sub.id },
        });
      }
      break;
    }
    case 'customer.subscription.updated':
    case 'customer.subscription.deleted': {
      const sub = event.data.object as Stripe.Subscription;
      const row = await db.subscription.findFirst({ where: { stripeSubscription: sub.id } });
      if (row) {
        const active = sub.status === 'active';
        await db.subscription.update({
          where: { id: row.id },
          data: {
            status: active ? 'ACTIVE' : sub.status === 'past_due' ? 'PAST_DUE' : 'CANCELED',
            currentPeriodEnd: new Date(sub.current_period_end * 1000),
          },
        });
      }
      break;
    }
    default:
      break;
  }

  return NextResponse.json({ received: true });
}
