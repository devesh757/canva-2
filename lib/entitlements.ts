// Entitlements: plan lookup + monthly AI usage quotas (enforced server-side).
import { Prisma } from '@prisma/client';
import { db } from './db';
import { planById, PLANS } from './pricing';
import type { PlanId } from './pricing';

export type UsageKind = 'AI_TEXT' | 'AI_IMAGE';

export async function activePlan(userId: string): Promise<PlanId> {
  const sub = await db.subscription.findUnique({ where: { userId } });
  // CANCELED never grants plan; ACTIVE / PAST_DUE / DEMO do.
  if (sub && sub.status !== 'CANCELED') return sub.plan as PlanId;
  return 'FREE';
}

export async function monthlyUsage(userId: string): Promise<Record<UsageKind, number>> {
  const start = new Date();
  start.setDate(1);
  start.setHours(0, 0, 0, 0);
  const rows = await db.usage.groupBy({
    by: ['kind'],
    where: { userId, createdAt: { gte: start } },
    _count: { _all: true },
  });
  const out: Record<UsageKind, number> = { AI_TEXT: 0, AI_IMAGE: 0 };
  for (const r of rows) if (r.kind === 'AI_TEXT' || r.kind === 'AI_IMAGE') out[r.kind] = r._count._all;
  return out;
}

export async function usageSummary(userId: string): Promise<Record<UsageKind, { used: number; limit: number; remaining: number }>> {
  const plan = planById(await activePlan(userId));
  const used = await monthlyUsage(userId);
  const limits: Record<UsageKind, number> = {
    AI_IMAGE: plan.aiImage,
    AI_TEXT: plan.aiText,
  };
  return {
    AI_IMAGE: { used: used.AI_IMAGE, limit: limits.AI_IMAGE, remaining: Math.max(0, limits.AI_IMAGE - used.AI_IMAGE) },
    AI_TEXT: { used: used.AI_TEXT, limit: limits.AI_TEXT, remaining: Math.max(0, limits.AI_TEXT - used.AI_TEXT) },
  };
}

export async function checkQuota(userId: string, kind: UsageKind) {
  const q = (await usageSummary(userId))[kind];
  return { ok: q.remaining > 0, ...q };
}

export async function recordUsage(
  userId: string,
  kind: UsageKind,
  provider: string,
  meta?: Record<string, unknown>,
) {
  await db.usage.create({
    data: { userId, kind, provider, meta: (meta ?? undefined) as Prisma.InputJsonValue | undefined },
  });
}

export const planIds = PLANS.map((p) => p.id);
