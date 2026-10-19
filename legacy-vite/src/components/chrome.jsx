// Editor chrome: TopBar, LeftRail, PageStrip, PreviewOverlay.
import { useEffect, useRef, useState } from 'react';
import { renderPage } from '../lib/exporter.js';

/* ---------------- TopBar ---------------- */
export function TopBar({ design, api, onName, canUndo, canRedo, onUndo, onRedo, zoom, onZoom, onFit, preview, presenting, onExit }) {
  const [menu, setMenu] = useState(false);
  const menuRef = useRef(null);
  useEffect(() => {
    const close = (e) => { if (!menuRef.current?.contains(e.target)) setMenu(false); };
    document.addEventListener('mousedown', close);
    return () => document.removeEventListener('mousedown', close);
  }, []);

  const doExport = async (kind) => {
    setMenu(false);
    const json = api.getJSON();
    const { w, h, name } = design;
    if (kind === 'png') return import('../lib/exporter.js').then((m) => m.downloadPage(json, name, w, h, 'png'));
    if (kind === 'jpg') return import('../lib/exporter.js').then((m) => m.downloadPage(json, name, w, h, 'jpeg', Math.min(2, 2000 / w)));
    if (kind === 'pdf') return import('../lib/exporter.js').then((m) => m.downloadPDF({ w, h, name }, apPages()));
    if (kind === 'json') return import('../lib/exporter.js').then((m) => m.downloadJSON({ ...design }, apPages()));
    function apPages() {
      // current page only keeps things fast; future: full deck rendering
      return [{ id: 'current', json }];
    }
  };

  return (
    <div className="topbar">
      <button className="btn icon" title="Back to home" onClick={onExit}>🏠</button>
      <input
        className="input"
        style={{ width: 230, height: 32, fontWeight: 600 }}
        value={design.name}
        onChange={(e) => onName(e.target.value)}
      />
      <span className="sep" style={{ width: 1, height: 22, background: 'var(--line)' }} />
      <button className="btn icon" disabled={!canUndo} title="Undo (Ctrl+Z)" onClick={onUndo}>↶</button>
      <button className="btn icon" disabled={!canRedo} title="Redo (Ctrl+Shift+Z)" onClick={onRedo}>↷</button>
      <span className="spacer" />
      <div className="seg">
        <button onClick={() => onZoom(Math.max(0.06, zoom - 0.1))}>−</button>
        <button style={{ minWidth: 58 }} onClick={onFit}>{Math.round(zoom * 100)}%</button>
        <button onClick={() => onZoom(Math.min(4, zoom + 0.1))}>+</button>
      </div>
      <span className="spacer" />
      <button className="btn" onClick={() => preview(false)}>▶︎ Present</button>
      <button className="btn" onClick={() => preview(true)}>👁 Preview</button>
      <div style={{ position: 'relative' }} ref={menuRef}>
        <button className="btn primary" onClick={() => setMenu((m) => !m)}>⬇ Download</button>
        {menu && (
          <div className="menu">
            <button onClick={() => doExport('png')}>🖼 This page as PNG</button>
            <button onClick={() => doExport('jpg')}>📸 This page as JPG</button>
            <button onClick={() => doExport('pdf')}>📄 This page as PDF</button>
            <button onClick={() => doExport('json')}>💾 Save design as JSON</button>
          </div>
        )}
      </div>
    </div>
  );
}

/* ---------------- LeftRail ---------------- */
const RAIL = [
  ['design', '🎨', 'Design'],
  ['elements', '🔷', 'Elements'],
  ['text', '🅣', 'Text'],
  ['photos', '🖼️', 'Photos'],
  ['uploads', '⬆️', 'Uploads'],
  ['draw', '✏️', 'Draw'],
  ['magic', '✨', 'Magic'],
  ['adjust', '🎛', 'Adjust'],
  ['background', 'RECT', 'Background'],
  ['layers', '📚', 'Layers'],
];
export function LeftRail({ panel, onPanel }) {
  return (
    <div className="leftrail">
      {RAIL.map(([id, icon, label]) => (
        <button key={id} className={`rail-btn${panel === id ? ' on' : ''}`} onClick={() => onPanel(id)}>
          <span className="ri">{icon === 'RECT' ? <span style={{
            display: 'inline-block', width: 13, height: 13, borderRadius: 3, border: '2px solid currentColor',
          }} /> : icon}</span>
          {label}
        </button>
      ))}
      <div className="rail-spacer" />
      <span style={{ fontSize: 10, color: '#7a6fae', textAlign: 'center', padding: 8 }}>Libre Studio</span>
    </div>
  );
}

/* ---------------- PageStrip ---------------- */
export function PageStrip({ pages, idx, thumbs, onSelect, onAdd, onDup, onDel }) {
  return (
    <div className="pagestrip">
      <span style={{ fontSize: 12, color: 'var(--ink-3)', margin: '0 4px' }}>Page {idx + 1} / {pages.length}</span>
      {pages.map((p, i) => (
        <button key={p.id} className={`page-thumb${i === idx ? ' on' : ''}`} onClick={() => onSelect(i)} title={`Page ${i + 1}`}>
          <div className="pt-img" style={{ backgroundImage: `url(${thumbs[p.id] || ''})` }} />
          <div className="pt-num">{i + 1}</div>
        </button>
      ))}
      <button className="btn icon" title="Add page" onClick={onAdd}>＋</button>
      <button className="btn icon" title="Duplicate page" onClick={onDup}>⧉</button>
      <button className="btn icon" title="Delete page" disabled={pages.length <= 1} onClick={onDel}>🗑</button>
    </div>
  );
}

/* ---------------- Preview / Present overlay ---------------- */
export function PreviewOverlay({ design, pages, idx, presenting, onClose, onNext, onPrev }) {
  const ref = useRef(null);
  const [img, setImg] = useState(null);

  useEffect(() => {
    let stale = false;
    const page = pages[idx];
    if (!page) return;
    renderPage(page.json, design.w, design.h, { format: 'jpeg', multiplier: Math.min(1, 1400 / design.w) }).then((url) => {
      if (!stale) setImg(url);
    });
    return () => { stale = true; };
  }, [idx, pages, design.w, design.h]);

  useEffect(() => {
    if (presenting && ref.current && !document.fullscreenElement) {
      ref.current.requestFullscreen?.().catch(() => {});
    }
    const onKey = (e) => {
      if (e.key === 'Escape') onClose();
      if (e.key === 'ArrowRight') onNext();
      if (e.key === 'ArrowLeft') onPrev();
    };
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('keydown', onKey);
      if (document.fullscreenElement) document.exitFullscreen?.().catch(() => {});
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [presenting]);

  return (
    <div className="preview-veil" ref={ref}>
      <div className="preview-canvas">
        {img ? <img src={img} alt={`page ${idx + 1}`} style={{ maxWidth: '100%', maxHeight: '100%', boxShadow: '0 20px 80px rgba(0,0,0,0.5)' }} /> : <span style={{ color: '#8b87a3' }}>Rendering…</span>}
      </div>
      <div className="present-controls">
        <button className="btn small" onClick={onPrev}>‹ Prev</button>
        <span>{idx + 1} / {pages.length}</span>
        <button className="btn small" onClick={onNext}>Next ›</button>
        <button className="btn small" onClick={onClose}>Exit ({presenting ? 'presenting' : 'preview'})</button>
      </div>
    </div>
  );
}
