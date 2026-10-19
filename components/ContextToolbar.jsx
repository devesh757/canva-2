// Contextual toolbar — adapts controls to the current selection.
import { useEffect, useRef, useState } from 'react';
import { FONTS } from '../data/fonts.js';
import { kindOf } from './CanvasStage.jsx';

const ALIGN_ICONS = {
  left: '⤝', centerX: '⤟', right: '⤞',
  top: '⤢', centerY: '⤣', bottom: '⤥',
};

function TB({ title, on, onClick, children }) {
  return (
    <button className={`ctx-tbtn${on ? ' on' : ''}`} title={title} onClick={onClick}>
      {children}
    </button>
  );
}

function ColorDot({ label, color, onPick }) {
  return (
    <button className="color-dot" title={label} style={{ background: color || '#ffffff' }} onClick={onPick} />
  );
}

function ColorPopover({ anchor, value, onPick, onClose }) {
  const ref = useRef(null);
  useEffect(() => {
    const close = (e) => { if (!ref.current?.contains(e.target)) onClose(); };
    document.addEventListener('mousedown', close);
    return () => document.removeEventListener('mousedown', close);
  }, [onClose]);
  const SWATCHES = [
    '#1f1d2b', '#33384d', '#6b688f', '#9aa0b4', '#c6c2d9', '#ffffff', '#000000',
    '#6434e9', '#9b6bff', '#4cc9f0', '#2f9e44', '#80ed99', '#ffb703', '#ffd166',
    '#ff6b6b', '#ff8a3d', '#e5484d', '#ff5d8f', '#f4a69b', '#c26d5b', '#29264d', '#101828', '#f5f1ff', '#fdf0d5',
  ];
  return (
    <div className="pop" ref={ref} style={{ top: 44, left: anchor.x, position: 'fixed' }}>
      <h5>{label_(anchor.kind)}</h5>
      <div className="swatches">
        {SWATCHES.map((c) => (
          <button key={c} className={`sw${c === value ? ' sel' : ''}`} style={{ background: c }} onClick={() => onPick(c)} />
        ))}
      </div>
      <input type="color" defaultValue={/^#[0-9a-f]{6}$/i.test(value || '') ? value : '#6434e9'} onChange={(e) => onPick(e.target.value)} />
    </div>
  );
}
const label_ = (k) => (k === 'stroke' ? 'Stroke color' : k === 'text' ? 'Text color' : 'Fill color');

export default function ContextToolbar({ meta, api, onOpenPanel }) {
  if (!meta || !meta.count || !api) return <div className="ctxbar hide" />;
  const popState = useState(null);
  const [pop, setPop] = popState;

  const commonTail = (
    <>
      <span className="sep" />
      <div className="ctx-ctrl">
        <TB title="Align left" onClick={() => api.align('left')}>⭰</TB>
        <TB title="Align center" onClick={() => api.align('centerX')}>⭤</TB>
        <TB title="Align right" onClick={() => api.align('right')}>⭲</TB>
        <TB title="Align top" onClick={() => api.align('top')}>⭱</TB>
        <TB title="Align middle" onClick={() => api.align('centerY')}>⭠</TB>
        <TB title="Align bottom" onClick={() => api.align('bottom')}>⭳</TB>
      </div>
      <span className="sep" />
      <div className="ctx-ctrl">
        <TB title="Bring forward" onClick={() => api.layer('forward')}>⤒</TB>
        <TB title="Send backward" onClick={() => api.layer('backward')}>⤓</TB>
        {meta.count === 1 ? null : (
          <>
            <TB title="Group" onClick={() => api.groupSelected()}>⊃</TB>
            <TB title="Ungroup" onClick={() => api.ungroupSelected()}>⊂</TB>
          </>
        )}
        <TB title="Duplicate" onClick={() => api.duplicateSelected()}>⧉</TB>
        <TB title="Lock" onClick={() => api.lockSelected(true)}>🔒</TB>
        <TB title="Delete" onClick={() => api.deleteSelected()}>🗑</TB>
      </div>
    </>
  );

  return (
    <>
      <div className="ctxbar">
        {/* ---- text controls ---- */}
        {meta.text ? (
          <div className="ctx-ctrl">
            <select
              className="font-select"
              value={meta.text.fontFamily || 'Inter'}
              onChange={(e) => { api.setFontFamily(e.target.value); }}
            >
              {FONTS.map((f) => (
                <option key={f.family} value={f.family} style={{ fontFamily: f.family }}>{f.label}</option>
              ))}
            </select>
            <input
              className="input ctx-num"
              type="number"
              min={8}
              max={600}
              value={Math.round(meta.text.fontSize || 48)}
              onChange={(e) => api.setText({ fontSize: Math.max(8, Math.min(600, +e.target.value || 48)) })}
            />
            <TB title="Bold" on={(meta.text?.fontWeight || 400) >= 600} onClick={() => api.setText({ fontWeight: (meta.text?.fontWeight || 400) >= 600 ? 400 : 700 })}><b>B</b></TB>
            <TB title="Italic" on={!!(meta.text?.fontStyle === 'italic')} onClick={() => api.setText({ fontStyle: meta.text?.fontStyle === 'italic' ? 'normal' : 'italic' })}><i>I</i></TB>
            <TB title="Underline" on={!!(meta.text?.underline)} onClick={() => api.setText({ underline: !meta.text.underline })}><u>U</u></TB>
            <TB title="Strikethrough" on={!!(meta.text?.linethrough)} onClick={() => api.setText({ linethrough: !meta.text.linethrough })}><s>S</s></TB>
            <span className="sep" />
            {['left', 'center', 'right'].map((a) => (
              <TB key={a} title={`Align ${a}`} on={meta.text?.textAlign === a} onClick={() => api.setText({ textAlign: a })}>
                {a === 'left' ? '⯇' : a === 'center' ? '≡' : '⯈'}
              </TB>
            ))}
            <span className="sep" />
            <ColorDot label="Text color" color={meta.text.fill} onPick={(e) => setPop({ kind: 'text', x: e.clientX - 110 })} />
            <span className="sep" />
            <label className="ctx-ctrl" title="Letter spacing" style={{ fontSize: 11, textAlign: 'center' }}>ls
              <input
                type="number"
                className="input ctx-num"
                style={{ width: 48 }}
                value={Math.round(meta.text.charSpacing || 0)}
                onChange={(e) => api.setText({ charSpacing: +e.target.value || 0 })}
              />
            </label>
            <label className="ctx-ctrl" title="Line height" style={{ fontSize: 11 }}>lh
              <input
                type="number"
                className="input ctx-num"
                style={{ width: 48 }}
                step={0.05}
                min={0.6}
                max={3}
                value={Math.round((meta.text.lineHeight || 1.16) * 100) / 100}
                onChange={(e) => api.setText({ lineHeight: Math.max(0.6, Math.min(3, +e.target.value || 1.16)) })}
              />
            </label>
            <TB title="Shadow" on={!!meta.text.shadow} onClick={() => api.textEffect('shadow', !meta.text.shadow)}>Ⓢ</TB>
            <TB title="Hollow outline" on={meta.text.fill === 'transparent'} onClick={() => api.textEffect('hollow', meta.text.fill !== 'transparent')}>◯</TB>
          </div>
        ) : null}

        {/* ---- image controls ---- */}
        {meta.image ? (
          <div className="ctx-ctrl">
            <button className="filter-chip" onClick={() => onOpenPanel('adjust')}>Adjust</button>
            <button className="filter-chip" onClick={() => { api.clearFilters(); }}>No filter</button>
            <button className="filter-chip" onClick={() => api.applyFilter({ grayscale: true })}>Mono</button>
            <button className="filter-chip" onClick={() => api.applyFilter({ sepia: true })}>Sepia</button>
            <span className="sep" />
            <TB title="Flip horizontal" onClick={() => api.flip('x')}>⇋</TB>
            <TB title="Rotate 90°" onClick={() => api.rotate90()}>↻</TB>
          </div>
        ) : null}

        {/* ---- shape controls ---- */}
        {meta.shapeLike && !meta.image ? (
          <div className="ctx-ctrl">
            <ColorDot label="Fill color" color={meta.single.fill} onPick={(e) => setPop({ kind: 'fill', x: e.clientX - 110 })} />
            {kindInvokesStroke(meta.single) && (
              <>
                <ColorDot label="Stroke color" color={meta.single.stroke} onPick={(e) => setPop({ kind: 'stroke', x: e.clientX - 110 })} />
                <input
                  className="input ctx-num"
                  type="number"
                  min={0}
                  max={40}
                  value={Math.round(meta.single.strokeWidth || 0)}
                  title="Stroke width"
                  onChange={(e) => api.set({ strokeWidth: Math.max(0, Math.min(40, +e.target.value || 0)) })}
                />
              </>
            )}
            {kindOfRect(meta.single) ? (
              <input
                className="input ctx-num"
                type="number"
                min={0}
                max={120}
                title="Corner radius"
                value={Math.round(meta.single.rx || 0)}
                onChange={(e) => api.set({ rx: Math.max(0, Math.min(120, +e.target.value || 0)), ry: Math.max(0, Math.min(120, +e.target.value || 0)) })}
              />
            ) : null}
          </div>
        ) : null}

        {meta.isFrame ? (
          <div className="ctx-ctrl">
            <span style={{ fontSize: 12, color: 'var(--ink-3)' }}>Frame — pick a photo to fill it</span>
          </div>
        ) : null}

        {meta.count > 1 ? (
          <div className="ctx-ctrl">
            <button className="filter-chip" onClick={() => api.distribute('x')}>Distribution →</button>
            <button className="filter-chip" onClick={() => api.distribute('y')}>Distribution ↓</button>
          </div>
        ) : null}

        {commonTail}
      </div>
      {pop ? (
        <ColorPopover
          anchor={pop}
          value={pop.kind === 'text' ? meta.text?.fill : pop.kind === 'stroke' ? meta.single?.stroke : meta.single?.fill}
          onPick={(c) => {
            if (pop.kind === 'text') api.set({ fill: c });
            else if (pop.kind === 'stroke') api.set({ stroke: c, strokeWidth: Math.max(1, meta.single.strokeWidth || 2) });
            else api.set({ fill: c });
            setPop(null);
          }}
          onClose={() => setPop(null)}
        />
      ) : null}
    </>
  );
}

function kindInvokesStroke(o) {
  if (!o) return false;
  return !['text', 'image'].includes(kindOf(o));
}
function kindOfRect(o) {
  return !!o && typeof o.rx === 'number';
}
