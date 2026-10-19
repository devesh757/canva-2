import { requireUser } from '@/lib/auth';
import { db } from '@/lib/db';
import { notFound } from 'next/navigation';
import EditorClient from '@/components/EditorClient';

export const dynamic = 'force-dynamic';

export default async function EditorPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ template?: string }>;
}) {
  const { id } = await params;
  const sp = await searchParams;
  const user = await requireUser();
  const design = await db.design.findFirst({
    where: { id, ownerId: user.id },
    include: { pages: { orderBy: { idx: 'asc' } } },
  });
  if (!design) notFound();

  // Server → client shape mirrors what the Editor saves back via PUT.
  const payload = {
    id: design.id,
    name: design.name,
    sizeId: design.sizeId,
    width: design.width,
    height: design.height,
    pages: design.pages.map((p) => ({ background: p.background, objects: p.objects })),
  };
  return <EditorClient design={payload} templateId={sp.template || ''} />;
}
