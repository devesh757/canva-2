// Home dashboard: create new designs, template gallery, recent designs.
import { useEffect, useState } from 'react';
import { SIZES, sizeById } from '../data/sizes.js';
import { TEMPLATES, templatePreviewSVG } from '../data/templates.js';
import { listDesigns, newDesign, getDesign, deleteDesign, importDesignFile } from '../lib/store.js';
import { fmtDate, toast } from '../lib/utils.js';

const svgInner = (tpl) =>
  templatePreviewSVG(tpl, 170).replace(/^.*?<svg[^>]*>/, '').replace(/<\/svg>\s*$/, '');

export default function Home({ onOpen }) {
  const [recent, setRecent] = useState([]);

  const refresh = () => setRecent(listDesigns());
  useEffect(refresh, []);

  const createBlank = (sizeId) => onOpen(newDesign(sizeId));
  const useTemplate = (tpl) => {
    const d = newDesign(tpl.sizeId, { name: tpl.name });
    onOpen({ ...d, _template: tpl });
  };
  const openSaved = (meta) => {
    const full = getDesign(meta.id);
    if (!full) { toast('Design data missing'); deleteDesign(meta.id); refresh(); return; }
    onOpen(full);
  };

  const importFile = (e) => {
    const f = e.target.files?.[0];
    if (!f) return;
    const fr = new FileReader();
    fr.onload = () => {
      try {
        const d = importDesignFile(JSON.parse(fr.result));
        if (d) { onOpen(d); toast(`Imported “${d.name}”`, 'ok'); }
        else toast('Not a Libre Studio design file', 'err');
      } catch { toast('Could not parse that file', 'err'); }
    };
    fr.readAsText(f);
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
        <label className="btn" style={{ cursor: 'pointer' }}>
          ⤴ Import .json
          <input type="file" accept=".json,application/json" hidden onChange={importFile} />
        </label>
      </div>

      <div>
        <div className="hero">
          <h1>Design anything, in your browser.</h1>
          <p>An open clean-room editor — canvas, templates, text, shapes, photos, magic AI tools.</p>
          <div className="create-grid">
            {SIZES.map((s) => (
              <button key={s.id} className="create-chip" onClick={() => createBlank(s.id)}>
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
          {recent.length === 0 ? (
            <p className="empty">Designs you create or edit are stored locally in this browser. Nothing is uploaded anywhere.</p>
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
                    <button className="btn small" style={{ flex: 1 }} onClick={() => openSaved(m)}>Open</button>
                    <button className="btn small danger" onClick={() => { deleteDesign(m.id); refresh(); toast('Deleted'); }}>🗑</button>
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
