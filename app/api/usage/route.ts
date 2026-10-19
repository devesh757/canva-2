import { NextResponse } from 'next/server';
import { getSessionUser } from '@/lib/auth';
import { usageSummary } from '@/lib/entitlements';

export async function GET() {
  const user = await getSessionUser();
  if (!user) {
    // Signed-out: surface Free-tier shape so the panel renders harmlessly.
    return NextResponse.json({ AI_TEXT: { used: 0, limit: 25, remaining: 25 }, AI_IMAGE: { used: 0, limit: 5, remaining: 5 }, plan: 'FREE' });
  }
  const usage = await usageSummary(user.id);
  return NextResponse.json(usage);
}
