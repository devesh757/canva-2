// Magic panel — offline heuristics + optional BYO OpenAI key (key stays in localStorage).
import { useState } from 'react';
import { magicDesigns, magicPalettes, magicWriteLocal, getOpenAIKey, setOpenAIKey, openaiText, openaiImage } from '../lib/ai.js';
import { templatePreviewSVG } from '../data/templates.js';
import { toast } from '../lib/utils.js';

const svgInner = (tpl) =>
  templatePreviewSVG(tpl, 160).replace(/^.*?<svg[^>]*>/, '').replace(/<\/svg>\s*$/, '');

const MODES = [
  ['design', '✨ Design'],
  ['palette', '🎨 Palette'],
  ['write', '✏️ Write'],
  ['image', '🖼 Image'],
];

export default function MagicPanel({ api }) {
  const [mode, setMode] = useState('design');
  const [prompt, setPrompt] = useState('');
  const [busy, setBusy] = useState(false);
  const [designs, setDesigns] = useState([]);
  const [palettes, setPalettes] = useState([]);
  const [written, setWritten] = useState(null);
  const [image, setImage] = useState(null);
  const [key, setKey] = useState(getOpenAIKey());
  const hasKey = !!key;

  const run = async () => {
    const p = prompt.trim();
    if (!p) { toast('Describe what you want first'); return; }
    if (mode === 'design') {
      setDesigns(magicDesigns(p));
    } else if (mode === 'palette') {
      setPalettes(magicPalettes(p));
    } else if (mode === 'write') {
      if (hasKey) {
        setBusy(true);
        try {
          const out = await openaiText(key, `Write copy for a graphic about: ${p}`);
          const lines = out.split('\n').filter(Boolean);
          setWritten({ headline: lines[0] || magicWriteLocal(p).headline, sub: lines[1] || '', caption: lines[2] || '' });
        } catch (e) {
          toast(`OpenAI failed — showing offline version (${e.message})`, 'err');
          setWritten(magicWriteLocal(p));
        }
        setBusy(false);
      } else {
        setWritten(magicWriteLocal(p));
      }
    } else if (mode === 'image') {
      if (!hasKey) {
        toast('Image generation needs an OpenAI key — add one below (or use Palette/Design offline)', 'err');
        return;
      }
      setBusy(true);
      try {
        const url = await openaiImage(key, p);
        setImage(url);
      } catch (e) {
        toast(`Image generation failed: ${e.message}`, 'err');
      }
      setBusy(false);
    }
  };

  return (
    <>
      <div className="magic-hero">
        <h3>Magic Studio</h3>
        <p>AI-assisted design. Design, Palette and Write run fully offline; Image and smart Write use your own OpenAI key when added.</p>
      </div>

      <div className="magic-modes">
        {MODES.map(([m, label]) => (
          <button key={m} className={`filter-chip${mode === m ? ' on' : ''}`} onClick={() => setMode(m)}>{label}</button>
        ))}
      </div>

      <textarea
        className="input"
        rows={2}
        placeholder={
          mode === 'design' ? 'e.g. announcement post for a coffee festival'
            : mode === 'palette' ? 'e.g. cozy autumn bakery brand'
              : mode === 'write' ? 'e.g. launch post for our new app'
                : 'e.g. watercolor fox in a flower field, minimal style'
        }
        value={prompt}
        onChange={(e) => setPrompt(e.target.value)}
      />
      <button className="btn primary" style={{ width: '100%', marginTop: 8 }} disabled={busy} onClick={run}>
        {busy ? 'Working…' : '✨ Generate'}
      </button>

      {/* design results */}
      {mode === 'design' && designs.length > 0 && (
        <div className="panel-sub" style={{ marginTop: 14 }}>Matched designs</div>
      )}
      {mode === 'design' && designs.map((t) => (
        <div key={t.id} className="tpl-item" onClick={() => { api.applyTemplate(t); toast(`Design “${t.name}” applied`); }}>
          <svg viewBox={`0 0 ${t.size.w} ${t.size.h}`} style={{ width: 160, height: 'auto', display: 'block' }} dangerouslySetInnerHTML={{ __html: svgInner(t) }} />
          <div className="cap"><span>{t.name}</span><span>{t.cat}</span></div>
        </div>
      ))}

      {/* palette results */}
      {mode === 'palette' && palettes.length > 0 && (
        <div className="pal-grid">
          <p className="backhint" style={{ padding: 0, textAlign: 'left' }}>Click a color to apply: selection first, otherwise the page background.</p>
          {palettes.map((cells, i) => (
            <div key={i} className="pal-row">
              {cells.map((c) => (
                <button key={c} className="pal-cell" style={{ background: c }}
                  onDoubleClick={() => api.setBg(c)}
                  onClick={() => {
                    const m = api.getMeta();
                    if (m && m.count) api.set({ fill: c });
                    else api.setBg(c);
                    toast(`${c} applied`);
                  }} />
              ))}
            </div>
          ))}
        </div>
      )}

      {/* write results */}
      {mode === 'write' && written && (
        <div className="magic-out">
          <b>{written.headline}</b>
          {written.sub ? <><br />{written.sub}</> : null}
          {written.caption ? <><br /><span style={{ color: 'var(--ink-3)' }}>{written.caption}</span></> : null}
          <div className="row" style={{ marginTop: 10 }}>
            <button className="btn small" onClick={() => { api.addText({ text: written.headline, fontSize: 96, weight: 800 }); toast('Headline added'); }}>Insert headline</button>
            {written.sub ? <button className="btn small" onClick={() => { api.addText({ text: written.sub, fontSize: 44, weight: 700 }); }}>Insert subline</button> : null}
            {written.caption ? <button className="btn small" onClick={() => { api.addText({ text: written.caption, fontSize: 28 }); }}>Insert caption</button> : null}
          </div>
        </div>
      )}

      {/* image results */}
      {mode === 'image' && image && (
        <>
          <img className="magic-img-out" src={image} alt="generated" />
          <button className="btn primary" style={{ width: '100%', marginTop: 8 }} onClick={async () => {
            await api.addImage(image, { fitPage: 0.6 });
            toast('Image added to canvas', 'ok');
          }}>Add to canvas</button>
        </>
      )}

      {/* key config */}
      <div className="keycfg">
        <div className="row">
          <b style={{ fontSize: 13 }}>OpenAI key</b>
          <span className="spacer" />
          {hasKey ? <span style={{ fontSize: 12, color: 'var(--ok)' }}>key saved locally</span> : <span style={{ fontSize: 12, color: 'var(--ink-3)' }}>offline mode</span>}
        </div>
        <div className="row" style={{ marginTop: 8 }}>
          <input className="input" type="password" placeholder="sk-..." value={key} onChange={(e) => setKey(e.target.value)} />
          <button className="btn small" onClick={() => { setOpenAIKey(key.trim()); toast('Key stored in this browser only', 'ok'); }}>Save</button>
        </div>
        <p style={{ fontSize: 11.5, color: 'var(--ink-3)', margin: '8px 0 0' }}>
          The key never leaves this browser except to call OpenAI directly. Generation costs are billed to your own account.
        </p>
      </div>
    </>
  );
}
