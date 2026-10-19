import { requireUser } from '@/lib/auth';
import { db } from '@/lib/db';
import { stripeConfigured } from '@/lib/billing';
import PricingClient from '@/components/PricingClient';

export default async function PricingPage() {
  const user = await requireUser();
  const sub = await db.subscription.findUnique({ where: { userId: user.id } });
  const plan = sub && (sub.status === 'ACTIVE' || sub.status === 'PAST_DUE' || sub.status === 'DEMO') ? sub.plan : 'FREE';
  return <PricingClient plan={plan} stripeReady={stripeConfigured()} isDemo={sub?.status === 'DEMO'} />;
}
