'use client';
// Home dashboard: create designs, template gallery, recents (server-stored now).
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { SIZES, sizeById } from '../data/sizes.js';
import { TEMPLATES, templatePreviewSVG } from '../data/templates.js';
import { fmtDate, toast } from '../lib/utils.js';

const svgInner = (tpl) =>
  templatePreviewSVG(tpl, 170).replace(/^.*?<svg[^>]*>/, '').replace(/<\/svg>\s*$/, '');

export default function HomeClient({ user, plan }) {
  const router = useRouter();
  const [recent, setRecent] = useState(null); // null = loading
  const [busy, setBusy] = useState(false);

  const refresh = async () => {
    try {
      const r = await fetch('/api/designs');
      const d = await r.json();
      setRecent(d.designs || []);
    } catch { setRecent([]); }
  };
  useEffect(() => { refresh(); }, []);

  const create = async (opts) => {
    if (busy) return;
    setBusy(true);
    try {
      const r = await fetch('/api/designs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(opts),
      });
      if (!r.ok) throw new Error((await r.json().catch(() => ({}))).error || 'Could not create design');
      const { design } = await r.json();
      router.push(`/editor/${design.id}${opts.templateId ? `?template=${opts.templateId}` : ''}`);
    } catch (e) {
      toast(e.message, 'err');
      setBusy(false);
    }
  };

  const createBlank = (sizeId) => {
    const s = sizeById(sizeId) || SIZES[0];
    create({ name: s.name, sizeId: s.id, width: s.w, height: s.h });
  };
  const useTemplate = (tpl) =>
    create({ name: tpl.name, sizeId: tpl.sizeId, width: tpl.size.w, height: tpl.size.h, templateId: tpl.id });

  const removeOne = async (id) => {
    await fetch(`/api/designs/${id}`, { method: 'DELETE' });
    setRecent((rs) => (rs || []).filter((d) => d.id !== id));
    toast('Design deleted');
  };

  const importFile = async (e) => {
    const f = e.target.files?.[0];
    if (!f) return;
    try {
      const parsed = JSON.parse(await f.text());
      if (!parsed || !Array.isArray(parsed.pages)) throw new Error('bad file');
      const created = await fetch('/api/designs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: parsed.name || 'Imported design',
          sizeId: parsed.sizeId || 'custom',
          width: parsed.w || parsed.width || 1080,
          height: parsed.h || parsed.height || 1080,
        }),
      }).then((r) => r.json());
      await fetch(`/api/designs/${created.design.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: parsed.name || 'Imported design',
          pages: parsed.pages.map((p) => ({ background: p.json?.background || '#ffffff', objects: p.json?.objects || [] })),
        }),
      });
      toast(`Imported “${parsed.name || 'design'}”`, 'ok');
      router.push(`/editor/${created.design.id}`);
    } catch (er) {
      toast(er.message === 'bad file' ? 'Not a Libre Studio design file' : 'Could not import that file', 'err');
    }
    e.target.value = '';
  };

  return (
    <div className="home">
      <div className="home-top">
        <div className="brand">
          <span className="brand-logo">✦</span>
          Libre Studio <small>original templates · open fonts</small>
        </div>
        <span className="spacer" />
        {plan && plan !== 'FREE' && <span className="plan-chip">{plan}</span>}
        <a className="btn small" href="/pricing">Manage plan</a>
        <a className="btn small" href="/account">Account</a>
        <label className="btn" style={{ cursor: 'pointer' }}>
          ⤴ Import .json
          <input type="file" accept=".json,application/json" hidden onChange={importFile} />
        </label>
      </div>

      <div>
        <div className="hero">
          <h1>Welcome back{user?.name ? `, ${user.name}` : ''}.</h1>
          <p>An open clean-room editor — canvas, templates, text, shapes, photos, magic AI tools. Designs save to your account.</p>
          <div className="create-grid">
            {SIZES.map((s) => (
              <button key={s.id} className="create-chip" disabled={busy} onClick={() => createBlank(s.id)}>
                <span className="emoji">{s.emoji}</span>
                <span><b>{s.name}</b><span>{s.w}×{s.h} · {s.hint}</span></span>
              </button>
            ))}
          </div>
        </div>

        <div className="home-section">
          <h2>Start with a template</h2>
          <div className="tpl-grid">
            {TEMPLATES.map((t) => (
              <div key={t.id} className="tpl-card" onClick={() => useTemplate(t)} title="Use this template">
                <svg viewBox={`0 0 ${t.size.w} ${t.size.h}`} dangerouslySetInnerHTML={{ __html: svgInner(t) }} />
                <div className="cap"><b>{t.name}</b><span>{t.cat} · {sizeById(t.sizeId).name}</span></div>
              </div>
            ))}
          </div>
        </div>

        <div className="home-section">
          <h2>Your designs</h2>
          {recent === null ? (
            <div className="design-grid">
              {[0, 1, 2].map((i) => <div key={i} className="skeleton design-card" />)}
            </div>
          ) : recent.length === 0 ? (
            <p className="empty">Nothing yet — create a design above and it will be saved to your account automatically.</p>
          ) : (
            <div className="design-grid">
              {recent.map((m) => (
                <div key={m.id} className="design-card">
                  {m.thumb
                    ? <img src={m.thumb} alt={m.name} />
                    : <div style={{ width: '100%', height: 120, background: '#f0edfa', borderRadius: '12px 12px 0 0' }} />}
                  <div className="cap">
                    <b>{m.name}</b>
                    <span style={{ color: 'var(--ink-3)', fontSize: 11 }}>{fmtDate(m.updatedAt)}</span>
                  </div>
                  <div className="row" style={{ padding: '0 8px 8px', gap: 6 }}>
                    <button className="btn small" style={{ flex: 1 }} onClick={() => router.push(`/editor/${m.id}`)}>Open</button>
                    <button className="btn small danger" onClick={() => removeOne(m.id)}>🗑</button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
