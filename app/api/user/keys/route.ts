import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getSessionUser } from '@/lib/auth';

// GET: masked key status for the Magic panel.
export async function GET() {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ provider: 'heuristic', hasOpenAI: false, hasNVIDIA: false });
  return NextResponse.json({
    provider: user.aiProvider,
    hasOpenAI: !!user.openaiKey,
    hasNVIDIA: !!user.nvidiaKey,
  });
}

// PUT: {provider?, openaiKey?: string|null, nvidiaKey?: string|null}
// string => set, null or "" => clear, undefined => untouched.
export async function PUT(req: Request) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: 'Sign in first' }, { status: 401 });
  const body = await req.json().catch(() => ({}));

  const data: { aiProvider?: string; openaiKey?: string | null; nvidiaKey?: string | null } = {};
  if (body.provider === 'heuristic' || body.provider === 'openai' || body.provider === 'nvidia') {
    data.aiProvider = body.provider;
  }
  const setKey = (col: 'openaiKey' | 'nvidiaKey', val: unknown) => {
    if (val === undefined) return;
    if (val === null || val === '') data[col] = null;
    else if (typeof val === 'string' && val.length <= 400) data[col] = val.trim();
  };
  setKey('openaiKey', body.openaiKey);
  setKey('nvidiaKey', body.nvidiaKey);

  await db.user.update({ where: { id: user.id }, data });
  return NextResponse.json({ ok: true });
}
