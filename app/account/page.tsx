import { requireUser } from '@/lib/auth';
import { db } from '@/lib/db';
import { usageSummary } from '@/lib/entitlements';
import { stripeConfigured } from '@/lib/billing';
import AccountClient from '@/components/AccountClient';

export default async function AccountPage() {
  const user = await requireUser();
  const sub = await db.subscription.findUnique({ where: { userId: user.id } });
  const usage = await usageSummary(user.id);
  return (
    <AccountClient
      user={{ email: user.email, name: user.name }}
      provider={user.aiProvider}
      hasOpenAI={!!user.openaiKey}
      hasNVIDIA={!!user.nvidiaKey}
      sub={sub ? { plan: sub.plan, status: sub.status, currentPeriodEnd: sub.currentPeriodEnd?.toISOString() } : null}
      usage={usage}
      stripeReady={stripeConfigured()}
    />
  );
}
