import { NextResponse } from 'next/server';
import { getSessionUser } from '@/lib/auth';
import { runText } from '@/lib/ai';
import { checkQuota, recordUsage } from '@/lib/entitlements';

export async function POST(req: Request) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: 'Sign in first' }, { status: 401 });

  const { prompt } = await req.json().catch(() => ({ prompt: '' }));
  if (!prompt || typeof prompt !== 'string') {
    return NextResponse.json({ error: 'Prompt required' }, { status: 400 });
  }

  const q = await checkQuota(user.id, 'AI_TEXT');
  if (!q.ok) {
    return NextResponse.json(
      { error: `Monthly text limit reached (${q.limit}). Upgrade your plan for more.` },
      { status: 402 },
    );
  }

  try {
    const { text, provider } = await runText(user, prompt.slice(0, 2000));
    await recordUsage(user.id, 'AI_TEXT', provider, { length: text.length });
    return NextResponse.json({ text, provider });
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message || 'AI request failed' }, { status: 502 });
  }
}
