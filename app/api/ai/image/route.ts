import { NextResponse } from 'next/server';
import { getSessionUser } from '@/lib/auth';
import { runImage } from '@/lib/ai';
import { checkQuota, recordUsage } from '@/lib/entitlements';

export async function POST(req: Request) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: 'Sign in first' }, { status: 401 });

  const { prompt } = await req.json().catch(() => ({ prompt: '' }));
  if (!prompt || typeof prompt !== 'string') {
    return NextResponse.json({ error: 'Prompt required' }, { status: 400 });
  }

  const q = await checkQuota(user.id, 'AI_IMAGE');
  if (!q.ok) {
    return NextResponse.json(
      { error: `Monthly image limit reached (${q.limit}). Upgrade your plan for more.` },
      { status: 402 },
    );
  }

  try {
    const { url, provider } = await runImage(user, prompt.slice(0, 1000));
    await recordUsage(user.id, 'AI_IMAGE', provider);
    return NextResponse.json({ url, provider });
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message || 'AI request failed' }, { status: 502 });
  }
}
