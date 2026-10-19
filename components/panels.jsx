// Left-side panels: Templates, Elements, Text, Photos, Uploads, Draw, Adjust, Background, Layers.
import { useEffect, useRef, useState } from 'react';
import { TEMPLATES, templatePreviewSVG, shapeDefFor } from '../data/templates.js';
import { SHAPES, shapeSvg } from '../data/shapes.js';
import { FONTS } from '../data/fonts.js';
import { SIZES, sizeById } from '../data/sizes.js';
import { loadRemoteImageAsDataURL, uid, toast } from '../lib/utils.js';

/* ---------------- Templates ---------------- */
export function TemplatesPanel({ api, design }) {
  const cats = [...new Set(TEMPLATES.map((t) => t.cat))];
  const [cat, setCat] = useState('All');
  const list = cat === 'All' ? TEMPLATES : TEMPLATES.filter((t) => t.cat === cat);
  return (
    <>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 14 }}>
        {['All', ...cats].map((c) => (
          <button key={c} className={`filter-chip${cat === c ? ' on' : ''}`} onClick={() => setCat(c)}>{c}</button>
        ))}
      </div>
      {list.map((t) => (
        <div key={t.id} className="tpl-item" title="Click to apply" onClick={() => { api.applyTemplate(t); toast(`Template “${t.name}” applied`); }}>
          <svg viewBox={`0 0 ${t.size.w} ${t.size.h}`} dangerouslySetInnerHTML={{ __html: templatePreviewSVG(t, 160).replace(/.*?<svg[^>]*>/, '').replace(/<\/svg>$/, '') }} />
          <div className="cap"><span>{t.name}</span><span>{t.cat}</span></div>
        </div>
      ))}
      <p className="backhint">Templates are originals for Libre Studio. Applying replaces the current page.</p>
    </>
  );
}

/* ---------------- Elements ---------------- */
const EMOJIS = ['😀', '😍', '🤩', '🙌', '👍', '🔥', '✨', '💡', '🎉', '🏆', '❤️', '⭐', '🌈', '🚀', '☕', '🍕', '🎁', '📌', '🎯', '🎵', '🧠', '💬', '🌟', '⚡'];

export function ElementsPanel({ api }) {
  return (
    <>
      <div className="panel-sub">Shapes</div>
      <div className="el-grid">
        {SHAPES.map((s) => (
          <button key={s.id} className="el-tile" title={s.name} onClick={() => api.addShape(s.id)}
            dangerouslySetInnerHTML={{ __html: shapeSvg(s.def, '#4a4760', 'none', 0) }} />
        ))}
      </div>
      <div className="panel-sub">Frames</div>
      <div className="frame-grid">
        {['rect', 'rrect', 'circle'].map((f) => (
          <button key={f} className="el-tile frame-tile" title={`${f} frame`} onClick={() => api.addFrame(f)}>
            <svg viewBox="0 0 100 100" width="46" height="46">
              {f === 'circle'
                ? <circle cx="50" cy="50" r="40" fill="#e9e4fb" stroke="#8b7bd8" strokeWidth="3" strokeDasharray="8 5" />
                : f === 'rrect'
                  ? <rect x="10" y="10" width="80" height="80" rx="16" fill="#e9e4fb" stroke="#8b7bd8" strokeWidth="3" strokeDasharray="8 5" />
                  : <rect x="10" y="10" width="80" height="80" fill="#e9e4fb" stroke="#8b7bd8" strokeWidth="3" strokeDasharray="8 5" />}
            </svg>
          </button>
        ))}
      </div>
      <p className="backhint">Select a frame, then click any photo to fill it.</p>
      <div className="panel-sub">Stickers</div>
      <div className="emoji-grid">
        {EMOJIS.map((e, i) => (
          <button key={i} className="emoji-cell" onClick={() => api.addEmoji(e)}>{e}</button>
        ))}
      </div>
    </>
  );
}

/* ---------------- Text ---------------- */
export function TextPanel({ api }) {
  const presets = [
    { label: 'Add a heading', size: 92, weight: 800 },
    { label: 'Add a subheading', size: 52, weight: 700 },
    { label: 'Add a little bit of body text', size: 30, weight: 400 },
  ];
  return (
    <>
      <div className="panel-sub">Quick styles</div>
      {presets.map((p) => (
        <button key={p.label} className="text-preset" onClick={() => api.addText({ text: p.label.replace('Add a ', '').replace('a little bit of ', 'little '), fontSize: p.size, weight: p.weight })}>
          <span style={{ fontSize: Math.min(20, p.size / 4), fontWeight: p.weight }}>{p.label}</span>
        </button>
      ))}
      <div className="panel-sub">Fonts</div>
      {FONTS.map((f) => (
        <div key={f.family} className="font-row" onClick={() => api.addText({ text: 'Sample heading', fontSize: 88, family: f.family, weight: 700 })}>
          <b style={{ fontFamily: `'${f.family}'` }}>{f.label}</b>
          <span>{f.cat}</span>
        </div>
      ))}
    </>
  );
}

/* ---------------- Photos ---------------- */
export function PhotosPanel({ api }) {
  const seedsState = useState(() => Array.from({ length: 24 }, () => uid().slice(0, 6)));
  const [seeds, setSeeds] = seedsState;
  const [busy, setBusy] = useState(null);
  const insert = async (seed) => {
    setBusy(seed);
    try {
      const s = api.getMeta ? api.getMeta() : { count: 0 };
      if (s.isFrame && s.single) {
        const url = await loadRemoteImageAsDataURL(`https://picsum.photos/seed/${seed}/1200/1200`);
        await api.fillFrame(s.single, url);
      } else {
        const url = await loadRemoteImageAsDataURL(`https://picsum.photos/seed/${seed}/1400/1400`);
        await api.addImage(url);
      }
    } catch (e) {
      toast('Photo service unreachable — try an upload instead', 'err');
    }
    setBusy(null);
  };
  return (
    <>
      <div className="panel-sub">Placeholder library (picsum.photos)</div>
      <button className="btn" style={{ width: '100%', marginBottom: 12 }} onClick={() => setSeeds(Array.from({ length: 24 }, () => uid().slice(0, 6)))}>
        🎲 Shuffle library
      </button>
      <div className="photo-grid">
        {seeds.map((s) => (
          <button key={s} className="photo-cell" disabled={busy === s} onClick={() => insert(s)}>
            <img src={`https://picsum.photos/seed/${s}/300/300`} alt="photo" loading="lazy" />
          </button>
        ))}
      </div>
      <p className="backhint">Placeholder photos are pulled from an external free service and converted to data URLs, so exports stay clean. Clicking a photo fills a selected frame first, if any.</p>
    </>
  );
}

/* ---------------- Uploads ---------------- */
export function UploadsPanel({ api }) {
  const [items, setItems] = useState([]);
  const [over, setOver] = useState(false);
  const fileRef = useRef(null);

  const readFiles = (files) => {
    Array.from(files).filter((f) => f.type.startsWith('image/')).slice(0, 12).forEach((f) => {
      const fr = new FileReader();
      fr.onload = () => setItems((prev) => [{ id: uid(), url: fr.result, name: f.name }, ...prev].slice(0, 24));
      fr.readAsDataURL(f);
    });
  };

  return (
    <>
      <div
        className={`upload-drop${over ? ' over' : ''}`}
        onDragOver={(e) => { e.preventDefault(); setOver(true); }}
        onDragLeave={() => setOver(false)}
        onDrop={(e) => { e.preventDefault(); setOver(false); readFiles(e.dataTransfer.files); }}
        onClick={() => fileRef.current?.click()}
      >
        <b>Drop images here</b><br />or click to browse
      </div>
      <input ref={fileRef} hidden type="file" accept="image/*" multiple onChange={(e) => { readFiles(e.target.files || []); e.target.value = ''; }} />
      {items.length === 0 ? <p className="empty">No uploads yet.</p> : (
        <div className="photo-grid">
          {items.map((it) => (
            <button key={it.id} className="photo-cell" onClick={() => api.addImage(it.url)}>
              <img src={it.url} alt={it.name} />
            </button>
          ))}
        </div>
      )}
      <p className="backhint">Uploads become data URLs on the canvas — your exports never reference external files.</p>
    </>
  );
}

/* ---------------- Draw ---------------- */
const DRAW_COLORS = ['#29264d', '#6434e9', '#ff5d8f', '#2f9e44', '#ffb703', '#4cc9f0', '#ffffff'];
export function DrawPanel({ api }) {
  const [tool, setTool] = useState('select');
  const [color, setColor] = useState(DRAW_COLORS[0]);
  const [width, setWidth] = useState(8);
  const setMode = (m) => { setTool(m); api.setDrawing(m); };
  useEffect(() => () => { api.setDrawing('select'); }, [api]);
  useEffect(() => { api.setBrush({ color, width }); }, [color, width, api]);
  return (
    <>
      <div className="draw-tools">
        {[
          ['select', '✥ Select'],
          ['pen', '✎ Pen'],
          ['highlight', '🖍 Highlighter'],
          ['eraser', '🧽 Object eraser'],
        ].map(([m, label]) => (
          <button key={m} className={`draw-tool${tool === m ? ' on' : ''}`} onClick={() => setMode(m)}>{label}</button>
        ))}
      </div>
      <div className="panel-sub">Color</div>
      <div className="row wrap">
        {DRAW_COLORS.map((c) => (
          <button key={c} className="color-dot" style={{ background: c }} onClick={() => setColor(c)} />
        ))}
        <input type="color" value={color} onChange={(e) => setColor(e.target.value)} style={{ width: 30, height: 26 }} />
      </div>
      <div className="panel-sub">Size</div>
      <div className="slider-row">
        <input type="range" min={2} max={40} value={width} onChange={(e) => setWidth(+e.target.value)} />
        <div className="row"><span style={{ fontSize: 12, color: 'var(--ink-3)' }}>{width} px</span></div>
      </div>
      <p className="backhint">Strokes and highlights become normal canvas objects — undo, layers and export all apply. The object eraser deletes whole objects on click.</p>
    </>
  );
}

/* ---------------- Adjust ---------------- */
export function AdjustPanel({ api, meta, tick }) {
  const single = meta?.single;
  const isImage = !!meta?.image;
  const [f, setF] = useState({ brightness: 0, contrast: 0, saturation: 0, blur: 0, sepia: false, grayscale: false });
  if (!meta || !meta.count) {
    return <p className="info-none">Select an object to adjust its properties:</p>;
  }
  return (
    <>
      {!isImage ? <div className="backhint" style={{ textAlign: 'left', padding: 0 }}>General</div> : null}
      <div className="panel-sub">Opacity</div>
      <input type="range" min={0} max={1} step={0.01} value={single?.opacity ?? 1}
        onChange={(e) => api.set({ opacity: +e.target.value })} />
      <div className="panel-sub">Transform</div>
      <div className="filter-row">
        <button className="filter-chip" onClick={() => api.rotate90()}>↻ 90°</button>
        <button className="filter-chip" onClick={() => api.flip('x')}>⇋ Flip H</button>
        <button className="filter-chip" onClick={() => api.flip('y')}>⇅ Flip V</button>
      </div>
      {!isImage ? <p className="backhint">Image filters appear when a photo is selected.</p> : (
        <>
          <div className="panel-sub">Filters</div>
          <AdjustSlider label="Brightness" min={-0.5} max={0.5} step={0.01} value={f.brightness}
            onChange={(v) => { setF((p) => ({ ...p, brightness: v })); api.applyFilter({ ...f, brightness: v }); }} />
          <AdjustSlider label="Contrast" min={-0.75} max={0.75} step={0.01} value={f.contrast}
            onChange={(v) => { setF((p) => ({ ...p, contrast: v })); api.applyFilter({ ...f, contrast: v }); }} />
          <AdjustSlider label="Saturation" min={-1} max={1} step={0.01} value={f.saturation}
            onChange={(v) => { setF((p) => ({ ...p, saturation: v })); api.applyFilter({ ...f, saturation: v }); }} />
          <AdjustSlider label="Blur" min={0} max={0.25} step={0.005} value={f.blur}
            onChange={(v) => { setF((p) => ({ ...p, blur: v })); api.applyFilter({ ...f, blur: v }); }} />
          <div className="filter-row" style={{ marginTop: 8 }}>
            <button className={`filter-chip${f.grayscale ? ' on' : ''}`} onClick={() => { const n = { ...f, grayscale: !f.grayscale }; setF(n); api.applyFilter(n); }}>Mono</button>
            <button className={`filter-chip${f.sepia ? ' on' : ''}`} onClick={() => { const n = { ...f, sepia: !f.sepia }; setF(n); api.applyFilter(n); }}>Sepia</button>
            <button className="filter-chip" onClick={() => { const z = { brightness: 0, contrast: 0, saturation: 0, blur: 0, sepia: false, grayscale: false }; setF(z); api.clearFilters(); }}>None</button>
          </div>
          <div className="panel-sub">Presets</div>
          <div className="filter-row">
            <button className="filter-chip" onClick={() => { const n = { brightness: 0.06, contrast: 0.1, saturation: 0.35, blur: 0, sepia: false, grayscale: false }; setF(n); api.applyFilter(n); }}>Vivid</button>
            <button className="filter-chip" onClick={() => { const n = { brightness: -0.05, contrast: -0.08, saturation: -0.4, blur: 0, sepia: false, grayscale: false }; setF(n); api.applyFilter(n); }}>Muted</button>
            <button className="filter-chip" onClick={() => { const n = { brightness: 0, contrast: 0, saturation: 0, blur: 0, sepia: true, grayscale: false }; setF(n); api.applyFilter(n); }}>Retro</button>
          </div>
        </>
      )}
      <p className="info-none">Selection: {meta.kinds.join(', ')} · {meta.count} object(s)</p>
    </>
  );
}
function AdjustSlider({ label, min, max, step, value, onChange }) {
  return (
    <div className="slider-row">
      <div className="row"><span style={{ fontSize: 12.5, fontWeight: 600 }}>{label}</span></div>
      <input type="range" min={min} max={max} step={step} value={value} onChange={(e) => onChange(+e.target.value)} />
    </div>
  );
}

/* ---------------- Background ---------------- */
const BG_COLORS = [
  '#ffffff', '#f5f1ff', '#e9e4fb', '#c6c2d9', '#8b87a3', '#4a4760', '#1f1d2b', '#000000',
  '#fff7f3', '#ffd6c0', '#f4a69b', '#c26d5b', '#7a2e1d',
  '#eafff4', '#80ed99', '#2f9e44', '#14432a',
  '#e7f6ff', '#9ad3f5', '#4cc9f0', '#0d3b52',
  '#fff3d1', '#ffd166', '#c49000', '#5c4300',
  '#ffe3ec', '#ff9ec7', '#ff5d8f', '#7a1f43',
  '#efe9ff', '#b79bff', '#6434e9', '#2a1157',
];
const BG_GRADIENTS = [
  { name: 'Aurora', stops: [{ offset: 0, color: '#6434e9' }, { offset: 1, color: '#ff5d8f' }], dir: 'diag' },
  { name: 'Sunrise', stops: [{ offset: 0, color: '#ffd166' }, { offset: 1, color: '#ff6b6b' }], dir: 'v' },
  { name: 'Ocean', stops: [{ offset: 0, color: '#0d3b52' }, { offset: 1, color: '#4cc9f0' }], dir: 'v' },
  { name: 'Mint', stops: [{ offset: 0, color: '#14432a' }, { offset: 1, color: '#80ed99' }], dir: 'dir' === 'v' ? 'v' : 'diag' },
  { name: 'Candy', stops: [{ offset: 0, color: '#ffe3ec' }, { offset: 1, color: '#b79bff' }], dir: 'diag' },
  { name: 'Ink', stops: [{ offset: 0, color: '#101828' }, { offset: 1, color: '#29264d' }], dir: 'diag' },
];
export function BackgroundPanel({ api }) {
  const current = api.getBg();
  const isSolid = typeof current === 'string';
  return (
    <>
      <div className="panel-sub">Solid colors</div>
      <div className="bg-grid">
        {BG_COLORS.map((c) => (
          <button key={c} className={`bg-tile${isSolid && current === c ? ' sel' : ''}`} style={{ background: c }} title={c} onClick={() => api.setBg(c)} />
        ))}
      </div>
      <div style={{ marginTop: 12 }}>
        <input type="color" style={{ width: '100%', height: 36, border: '1px solid var(--line)', borderRadius: 8, background: '#fff' }} onChange={(e) => api.setBg(e.target.value)} />
      </div>
      <div className="panel-sub">Gradients</div>
      <div className="bg-grid">
        {BG_GRADIENTS.map((g) => (
          <button key={g.name} className="bg-tile" title={g.name}
            style={{ background: `linear-gradient(135deg, ${g.stops[0].color}, ${g.stops[1].color})` }}
            onClick={() => api.addGradientBg(g)} />
        ))}
      </div>
      <button className="btn danger" style={{ width: '100%', marginTop: 12 }} onClick={() => api.clearGradientBg()}>
        Remove gradient overlay
      </button>
      <p className="backhint">Solid colors set the page background. Gradients are added as a locked overlay rectangle at the back — “Remove gradient overlay” clears them.</p>
    </>
  );
}

/* ---------------- Layers ---------------- */
export function LayersPanel({ api, tick, setTick, meta }) {
  const list = api.getObjects ? api.getObjects().slice().reverse() : [];
  return (
    <>
      {list.length === 0 ? <p className="empty">Canvas is empty.</p> : (
        list.map(({ obj, kind, label }) => (
          <div key={obj.__uid || uid()} className={`layer-item${meta?.single === obj ? ' sel' : ''}`} onClick={() => api.setActive(obj)}>
            <span className="lg">{{ text: '🅣', image: '🖼️', rect: '▭', circle: '⬤', path: '✦', line: '—"'.trim() }[kind] || '✦'}</span>
            <b>{kind === 'text' ? 'Text' : kind === 'image' ? 'Image' : 'Shape'} {label !== 'Text' && label !== 'Image' ? '' : '· ' + label}</b>
            <button title="Show/hide" onClick={(e) => { e.stopPropagation(); obj.visible = !obj.visible; obj.canvas.requestRenderAll(); api.forceChange(); setTick(tick + 1); }}>
              {obj.visible ? '👁' : '🚫'}
            </button>
            <button title="Lock/unlock" onClick={(e) => {
              e.stopPropagation();
              const lock = !obj.lockMovementX;
              obj.set({ lockMovementX: lock, lockMovementY: lock, lockScalingX: lock, lockScalingY: lock, lockRotation: lock });
              api.forceChange(); setTick(tick + 1);
            }}>{obj.lockMovementX ? '🔒' : '🔓'}</button>
            <button title="Delete" onClick={(e) => { e.stopPropagation(); api.removeObject(obj); setTick(tick + 1); }}>🗑</button>
          </div>
        ))
      )}
      <div className="filter-row" style={{ marginTop: 10 }}>
        <button className="filter-chip" onClick={() => { api.layer('forward'); setTick(tick + 1); }}>Bring forward</button>
        <button className="filter-chip" onClick={() => { api.layer('backward'); setTick(tick + 1); }}>Send backward</button>
      </div>
    </>
  );
}

export { SIZES, sizeById, shapeDefFor };
