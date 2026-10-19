// Magic Studio panel — provider-aware AI.
// Modes Design/Palette always run locally (heuristic). Write/Image call the app's
// /api/ai routes which use the user's configured provider (OpenAI or NVIDIA NIM).
import { useEffect, useState } from 'react';
import { magicDesigns, magicPalettes, magicWriteLocal } from '../lib/magic-local.js';
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

const PROVIDER_LABEL = { heuristic: 'Offline', openai: 'OpenAI', nvidia: 'NVIDIA NIM' };

export default function MagicPanel({ api }) {
  const [mode, setMode] = useState('design');
  const [prompt, setPrompt] = useState('');
  const [busy, setBusy] = useState(false);
  const [designs, setDesigns] = useState([]);
  const [palettes, setPalettes] = useState([]);
  const [written, setWritten] = useState(null);
  const [image, setImage] = useState(null);

  const [provider, setProvider] = useState('heuristic');
  const [hasOpenAI, setHasOpenAI] = useState(false);
  const [hasNVIDIA, setHasNVIDIA] = useState(false);
  const [openaiInput, setOpenaiInput] = useState('');
  const [nvidiaInput, setNvidiaInput] = useState('');
  const [usage, setUsage] = useState({});
  const [savingKeys, setSavingKeys] = useState(false);

  const loadStatus = async () => {
    try {
      const [keys, use] = await Promise.all([
        fetch('/api/user/keys').then((r) => r.json()),
        fetch('/api/usage').then((r) => r.json()),
      ]);
      setProvider(keys.provider || 'heuristic');
      setHasOpenAI(!!keys.hasOpenAI);
      setHasNVIDIA(!!keys.hasNVIDIA);
      setUsage(use);
    } catch { /* panel still works offline */ }
  };
  useEffect(() => { loadStatus(); }, []);

  const liveProvider =
    (hasOpenAI && provider === 'openai') || (hasNVIDIA && provider === 'nvidia') ? provider : 'heuristic';
  const imgLimit = usage?.AI_IMAGE || { used: 0, limit: Infinity };
  const txtLimit = usage?.AI_TEXT || { used: 0, limit: Infinity };

  const saveKeys = async () => {
    setSavingKeys(true);
    try {
      const body = { provider }; // empty inputs leave stored keys untouched (null clears, via /account)
      if (openaiInput.trim()) body.openaiKey = openaiInput.trim();
      if (nvidiaInput.trim()) body.nvidiaKey = nvidiaInput.trim();
      const res = await fetch('/api/user/keys', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      if (!res.ok) throw new Error(`save failed (${res.status})`);
      setOpenaiInput('');
      setNvidiaInput('');
      toast('AI settings saved', 'ok');
      loadStatus();
    } catch (e) {
      toast(`Could not save keys: ${e.message}`, 'err');
    }
    setSavingKeys(false);
  };

  const callApi = async (kind, promptText) => {
    const res = await fetch(`/api/ai/${kind}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ prompt: promptText }),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      const err = new Error(data.error || `request failed (${res.status})`);
      err.quota = res.status === 402 ? data : null;
      throw err;
    }
    return data;
  };

  const run = async () => {
    const p = prompt.trim();
    if (!p) { toast('Describe what you want first'); return; }
    if (mode === 'design') {
      setDesigns(magicDesigns(p));
    } else if (mode === 'palette') {
      setPalettes(magicPalettes(p));
    } else if (mode === 'write') {
      setBusy(true);
      try {
        if (liveProvider !== 'heuristic') {
          const out = await callApi('text', p);
          const lines = (out.text || '').split('\n').map((s) => s.trim()).filter(Boolean);
          setWritten({ headline: lines[0] || magicWriteLocal(p).headline, sub: lines[1] || '', caption: lines[2] || '' });
        } else {
          setWritten(magicWriteLocal(p));
        }
      } catch (e) {
        toast(`${PROVIDER_LABEL[liveProvider]} failed — showing offline version (${e.message})`, 'err');
        setWritten(magicWriteLocal(p));
      }
      setBusy(false);
    } else if (mode === 'image') {
      if (liveProvider === 'heuristic') {
        toast('Image generation needs OpenAI or NVIDIA key — add one below', 'err');
        return;
      }
      if (imgLimit.used >= imgLimit.limit) {
        toast(`Monthly image limit reached (${imgLimit.limit}). Upgrade your plan for more.`, 'err');
        return;
      }
      setBusy(true);
      try {
        const out = await callApi('image', p);
        setImage(out.url);
        loadStatus();
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
        <p>Design and Palette always run locally. Write &amp; Image use your selected provider — OpenAI or NVIDIA NIM (free tier key from build.nvidia.com).</p>
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

      {/* usage meters */}
      {(mode === 'write' || mode === 'image') && Number.isFinite(imgLimit.limit) && (
        <div className="usage-meter">
          <div className="row" style={{ gap: 8 }}>
            <span style={{ fontSize: 12, color: 'var(--ink-3)' }}>This month</span>
            <span className="spacer" />
            <span style={{ fontSize: 12 }}>Text {txtLimit.used}/{Number.isFinite(txtLimit.limit) ? txtLimit.limit : '∞'}</span>
            <span style={{ fontSize: 12 }}>Image {imgLimit.used}/{imgLimit.limit}</span>
          </div>
          <div className="meter"><i style={{ width: `${Math.min(100, (imgLimit.used / imgLimit.limit) * 100)}%` }} /></div>
        </div>
      )}

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

      {/* provider + key config (stored on the server with your account) */}
      <div className="keycfg">
        <div className="row">
          <b style={{ fontSize: 13 }}>AI provider</b>
          <span className="spacer" />
          <button className="btn small" disabled={savingKeys} onClick={saveKeys}>Save settings</button>
        </div>
        <div className="row" style={{ marginTop: 8 }}>
          {['heuristic', 'openai', 'nvidia'].map((pid) => (
            <button key={pid} className={`filter-chip${provider === pid ? ' on' : ''}`} onClick={() => setProvider(pid)}>
              {PROVIDER_LABEL[pid]}{(pid === 'openai' && hasOpenAI) || (pid === 'nvidia' && hasNVIDIA) ? ' ✓' : ''}
            </button>
          ))}
        </div>
        <div className="row" style={{ marginTop: 8 }}>
          <input
            className="input"
            type="password"
            placeholder={hasOpenAI ? 'OpenAI key saved — type to replace' : 'OpenAI key (sk-…)'}
            value={openaiInput}
            onChange={(e) => setOpenaiInput(e.target.value)}
          />
        </div>
        <div className="row" style={{ marginTop: 8 }}>
          <input
            className="input"
            type="password"
            placeholder={hasNVIDIA ? 'NVIDIA key saved — type to replace' : 'NVIDIA NIM key (nvapi-…)'}
            value={nvidiaInput}
            onChange={(e) => setNvidiaInput(e.target.value)}
          />
        </div>
        <p style={{ fontSize: 11.5, color: 'var(--ink-3)', margin: '8px 0 0' }}>
          Keys are stored on your account and only used by this app's API routes. Free NVIDIA NIM keys: build.nvidia.com.
        </p>
      </div>
    </>
  );
}
