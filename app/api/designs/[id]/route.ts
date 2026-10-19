import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getSessionUser } from '@/lib/auth';

async function ownedDesign(id: string, userId: string) {
  return db.design.findFirst({ where: { id, ownerId: userId }, include: { pages: { orderBy: { idx: 'asc' } } } });
}

async function guard(id: string) {
  const user = await getSessionUser();
  if (!user) return { error: NextResponse.json({ error: 'Sign in first' }, { status: 401 }) };
  const design = await ownedDesign(id, user.id);
  if (!design) return { error: NextResponse.json({ error: 'Design not found' }, { status: 404 }) };
  return { user, design };
}

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const g = await guard(id);
  if (g.error) return g.error;
  return NextResponse.json({ design: g.design });
}

// Full save: name + optional thumb + full page list (index-based, replaces page rows).
export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const g = await guard(id);
  if (g.error) return g.error;
  const body = await req.json().catch(() => ({}));

  const data: { name?: string; thumb?: string | null; width?: number; height?: number; sizeId?: string; updatedAt?: Date } = {};
  if (typeof body.name === 'string') data.name = body.name.slice(0, 80) || 'Untitled design';
  if (typeof body.thumb === 'string' && body.thumb.length < 400_000) data.thumb = body.thumb;
  if (Number.isFinite(body.width) && Number.isFinite(body.height)) {
    data.width = Math.max(50, Math.min(6000, Number(body.width)));
    data.height = Math.max(50, Math.min(6000, Number(body.height)));
    data.sizeId = String(body.sizeId || 'custom');
  }

  await db.$transaction(async (tx) => {
    await tx.design.update({ where: { id }, data: { ...data, updatedAt: new Date() } });
    if (Array.isArray(body.pages)) {
      const pagesIn = body.pages as Array<{ background?: string; objects?: unknown }>;
      await tx.page.deleteMany({ where: { designId: id } });
      const rows = pagesIn.slice(0, 100).map((p, idx) => ({
        designId: id,
        idx,
        background: typeof p?.background === 'string' ? p.background : '#ffffff',
        objects: p?.objects ?? [],
      }));
      if (rows.length) await tx.page.createMany({ data: rows });
    }
  });

  return NextResponse.json({ ok: true, savedAt: new Date().toISOString() });
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const g = await guard(id);
  if (g.error) return g.error;
  await db.design.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
