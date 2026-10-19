import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getSessionUser } from '@/lib/auth';

// List the signed-in user's designs (dashboard recents).
export async function GET() {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ designs: [] });
  const designs = await db.design.findMany({
    where: { ownerId: user.id },
    orderBy: { updatedAt: 'desc' },
    take: 24,
    select: { id: true, name: true, sizeId: true, width: true, height: true, thumb: true, updatedAt: true, _count: { select: { pages: true } } },
  });
  return NextResponse.json({ designs });
}

// Create a design (optionally from a template id; the client applies the template after redirect).
export async function POST(req: Request) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: 'Sign in first' }, { status: 401 });
  const body = await req.json().catch(() => ({}));
  const name = String(body.name || 'Untitled design').slice(0, 80);
  const width = Math.min(6000, Math.max(50, Number(body.width) || 1080));
  const height = Math.min(6000, Math.max(50, Number(body.height) || 1080));
  const sizeId = String(body.sizeId || 'custom');

  const design = await db.design.create({
    data: {
      ownerId: user.id,
      name,
      sizeId,
      width,
      height,
      pages: { create: [{ idx: 0, background: '#ffffff', objects: [] }] },
    },
    include: { pages: true },
  });
  return NextResponse.json({ design });
}
