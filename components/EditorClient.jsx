'use client';
// Client wrapper bridging the server-loaded design with the Editor's save API.
import { useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Editor from './Editor.jsx';
import { templateById } from '../data/templates.js';

export default function EditorClient({ design, templateId }) {
  const router = useRouter();
  const tpl = templateId ? templateById(templateId) : null;

  // Shape expected by Editor internals: {id,name,sizeId,w,h,pages:[{id,json}]}
  const ed = {
    id: design.id,
    name: design.name,
    sizeId: design.sizeId,
    w: design.width,
    h: design.height,
    pages: design.pages.map((p, i) => ({ id: `p${i}`, json: { objects: p.objects || [], background: p.background || '#ffffff' } })),
  };

  const persist = useCallback(async (payload, thumb) => {
    try {
      await fetch(`/api/designs/${design.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...payload, thumb: thumb ?? undefined }),
      });
    } catch { /* autosave retries on next change */ }
  }, [design.id]);

  return <Editor design={ed} initialTemplate={tpl} onPersist={persist} onExit={() => router.push('/')} />;
}
