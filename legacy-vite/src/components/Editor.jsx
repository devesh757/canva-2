// Editor orchestrator: undo/redo history, pages, zoom-to-fit, autosave, keyboard shortcuts.
import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';
import CanvasStage from './CanvasStage.jsx';
import ContextToolbar from './ContextToolbar.jsx';
import MagicPanel from './MagicPanel.jsx';
import {
  TemplatesPanel, ElementsPanel, TextPanel, PhotosPanel, UploadsPanel,
  DrawPanel, AdjustPanel, BackgroundPanel, LayersPanel,
} from './panels.jsx';
import { TopBar, LeftRail, PageStrip, PreviewOverlay } from './chrome.jsx';
import { saveDesign } from '../lib/store.js';
import { renderPage } from '../lib/exporter.js';
import { uid, clamp, toast } from '../lib/utils.js';

const HISTORY_MAX = 60;

const PANEL_TITLES = {
  design: 'Design templates', elements: 'Elements', text: 'Text', photos: 'Photos',
  uploads: 'Uploads', draw: 'Draw', magic: 'Magic Studio', adjust: 'Adjust',
  background: 'Background', layers: 'Layers',
};

export default function Editor({ design: initialDesign, onExit, onSaved }) {
  const designRef = useRef({ ...initialDesign, pages: initialDesign.pages });

  const [pageIndex, setPageIndex] = useState(0);
  const pageIndexRef = useRef(0);
  pageIndexRef.current = pageIndex;

  const [loadJson, setLoadJson] = useState(() => initialDesign.pages[0].json);
  const [panel, setPanel] = useState('design');
  const [meta, setMeta] = useState({ count: 0, kinds: [] });
  const [zoom, setZoom] = useState(0.5);
  const [tick, setTick] = useState(0);
  const [thumbs, setThumbs] = useState({});
  const [previewState, setPreviewState] = useState(null);

  const apiRef = useRef({});
  const stageWrapRef = useRef(null);
  const histRef = useRef({ list: [], p: -1 });
  const commitRef = useRef({ pageId: null, str: '' });
  const saveTimer = useRef(null);

  const PAGES = () => designRef.current.pages;
  const current = () => PAGES()[pageIndexRef.current];

  /* ---------------- history & commit ---------------- */
  const pushHistory = useCallback((json, idx) => {
    const h = histRef.current;
    const targetIdx = idx ?? pageIndexRef.current;
    const top = h.list[h.p];
    if (top && top.idx === targetIdx && JSON.stringify(top.json) === JSON.stringify(json)) return;
    h.list = h.list.slice(0, h.p + 1);
    h.list.push({ json, idx: targetIdx });
    if (h.list.length > HISTORY_MAX) h.list.shift();
    h.p = h.list.length - 1;
    setTick((t) => t + 1);
  }, []);

  const commit = useCallback(() => {
    const api = apiRef.current;
    const page = current();
    if (!api || !page) return;
    const json = api.getJSON();
    const str = JSON.stringify(json);
    if (commitRef.current.pageId === page.id && commitRef.current.str === str) return;
    commitRef.current = { pageId: page.id, str };
    page.json = json;
    pushHistory(json);
    schedulePersist();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pushHistory]);

  /* ---------------- persistence ---------------- */
  const schedulePersist = () => {
    clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(persistNow, 1100);
  };
  const persistNow = useCallback(() => {
    const d = { ...designRef.current };
    const page = current();
    if (!page) return;
    renderPage(page.json, d.w, d.h, { format: 'jpeg', multiplier: Math.min(1, 180 / Math.max(d.w, d.h)) })
      .then((url) => {
        setThumbs((p) => ({ ...p, [page.id]: url }));
        saveDesign(d, url);
        onSaved?.();
      })
      .catch(() => saveDesign(d));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /* ---------------- page management ---------------- */
  const flushCurrent = () => {
    const api = apiRef.current;
    const page = current();
    if (!api || !page) return;
    const json = api.getJSON();
    const str = JSON.stringify(json);
    if (commitRef.current.pageId === page.id && commitRef.current.str === str) return;
    commitRef.current = { pageId: page.id, str };
    page.json = json;
  };

  const switchPage = (target) => {
    if (target === pageIndexRef.current || target < 0 || target >= PAGES().length) return;
    flushCurrent();
    const targetPage = PAGES()[target];
    setPageIndex(target);
    setLoadJson(targetPage.json);
    pushHistory(targetPage.json, target);
  };

  const addPage = () => {
    flushCurrent();
    PAGES().push({ id: uid(), json: { objects: [], background: '#ffffff' } });
    const newIdx = PAGES().length - 1;
    setPageIndex(newIdx);
    setLoadJson(PAGES()[newIdx].json);
    pushHistory(PAGES()[newIdx].json, newIdx);
    setTick((t) => t + 1);
    persistNow();
  };

  const dupPage = () => {
    flushCurrent();
    const src = current();
    PAGES().splice(pageIndexRef.current + 1, 0, {
      id: uid(),
      json: { objects: src.json.objects.map((o) => ({ ...o })), background: src.json.background },
    });
    const newIdx = pageIndexRef.current + 1;
    setPageIndex(newIdx);
    setLoadJson(PAGES()[newIdx].json);
    pushHistory(PAGES()[newIdx].json, newIdx);
    setTick((t) => t + 1);
    persistNow();
  };

  const delPage = (i) => {
    if (PAGES().length <= 1) return;
    PAGES().splice(i, 1);
    const newIdx = clamp(pageIndexRef.current > i ? pageIndexRef.current - 1 : pageIndexRef.current, 0, PAGES().length - 1);
    setPageIndex(newIdx);
    setLoadJson(PAGES()[newIdx].json);
    pushHistory(PAGES()[newIdx].json, newIdx);
    setTick((t) => t + 1);
    persistNow();
  };

  /* ---------------- undo / redo ---------------- */
  const applyEntry = (e) => {
    const pages = PAGES();
    if (e.idx >= pages.length) { toast('That page no longer exists'); return; }
    pages[e.idx].json = e.json;
    if (e.idx !== pageIndexRef.current) {
      setPageIndex(e.idx);
      setLoadJson(e.json);
      pushHistory(e.json, e.idx);
    } else {
      setLoadJson(e.json);
      pushHistory(e.json, e.idx);
    }
  };
  const undo = () => {
    const h = histRef.current;
    if (h.p <= 0) return;
    h.p -= 1;
    applyEntry(h.list[h.p]);
    setTick((t) => t + 1);
  };
  const redo = () => {
    const h = histRef.current;
    if (h.p >= h.list.length - 1) return;
    h.p += 1;
    applyEntry(h.list[h.p]);
    setTick((t) => t + 1);
  };

  /* ---------------- initial mount: history seed, thumbs, zoom sync, fit ---------------- */
  useLayoutEffect(() => {
    // seed history with the initial page state (no API dependency needed here)
    const seed = current();
    pushHistory(seed?.json || { objects: [], background: '#ffffff' }, 0);
    fitZoom();
    window.addEventListener('resize', fitZoom);
    PAGES().forEach((_, i) => renderThumb(i));
    return () => window.removeEventListener('resize', fitZoom);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /* passive effect — runs after CanvasStage's init effect, so the API is ready */
  useEffect(() => {
    const tpl = window.__lsPendingTemplate;
    window.__lsPendingTemplate = null;
    if (tpl && apiRef.current?.applyTemplate) {
      apiRef.current.applyTemplate(tpl);
    }
    // keep the Editor zoom state in sync with Ctrl+wheel zoom on the canvas
    const onZoomEvent = (e) => { if (typeof e.detail === 'number') setZoom(e.detail); };
    window.addEventListener('ls-zoom', onZoomEvent);
    return () => window.removeEventListener('ls-zoom', onZoomEvent);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const fitZoom = () => {
    const el = stageWrapRef.current;
    if (!el) return;
    const z = Math.min((el.clientWidth - 70) / designRef.current.w, (el.clientHeight - 90) / designRef.current.h);
    setZoom(clamp(Math.min(z, 1), 0.06, 2));
  };

  const renderThumb = (i) => {
    const pg = PAGES()[i];
    if (!pg) return;
    renderPage(pg.json, designRef.current.w, designRef.current.h, { format: 'jpeg', multiplier: Math.min(1, 90 / Math.max(designRef.current.w, designRef.current.h)) })
      .then((url) => setThumbs((p) => ({ ...p, [pg.id]: url })))
      .catch(() => {});
  };

  /* ---------------- keyboard ---------------- */
  useEffect(() => {
    const onKey = (e) => {
      const api = apiRef.current;
      if (!api) return;
      const tag = e.target?.tagName;
      const editing = !!api.getMeta?.().single?.isEditing;
      if (['INPUT', 'TEXTAREA', 'SELECT'].includes(tag) || editing || e.target?.isContentEditable) return;
      const k = e.key.toLowerCase();
      const ctrl = e.ctrlKey || e.metaKey;

      if (ctrl && k === 'z') { e.preventDefault(); e.shiftKey ? redo() : undo(); return; }
      if (ctrl && k === 'y') { e.preventDefault(); redo(); return; }
      if (ctrl && k === 's') { e.preventDefault(); flushCurrent(); persistNow(); toast('Design saved to this browser', 'ok'); return; }
      if (ctrl && k === 'd') { e.preventDefault(); api.duplicateSelected(); return; }
      if (ctrl && k === ']') { e.preventDefault(); api.layer('forward'); return; }
      if (ctrl && k === '[') { e.preventDefault(); api.layer('backward'); return; }
      if (e.key === 'Delete' || e.key === 'Backspace') {
        if (api.getMeta().count) { e.preventDefault(); api.deleteSelected(); }
        return;
      }
      if (e.key === 'Escape') {
        const c = api.canvas();
        c?.discardActiveObject();
        c?.requestRenderAll();
        return;
      }
      if (k.startsWith('arrow') && api.getMeta().count) {
        e.preventDefault();
        const step = e.shiftKey ? 10 : 1;
        const map = {
          arrowleft: [-step, 0], arrowright: [step, 0], arrowup: [0, -step], arrowdown: [0, step],
        };
        api.nudge(...(map[k] || [0, 0]));
        commit();
      }
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /* ---------------- panel host ---------------- */
  const panelBody = () => {
    switch (panel) {
      case 'design': return <TemplatesPanel api={apiRef.current} design={designRef.current} />;
      case 'elements': return <ElementsPanel api={apiRef.current} />;
      case 'text': return <TextPanel api={apiRef.current} />;
      case 'photos': return <PhotosPanel api={apiRef.current} />;
      case 'uploads': return <UploadsPanel api={apiRef.current} />;
      case 'draw': return <DrawPanel api={apiRef.current} />;
      case 'magic': return <MagicPanel api={apiRef.current} />;
      case 'adjust': return <AdjustPanel api={apiRef.current} meta={meta} tick={tick} />;
      case 'background': return <BackgroundPanel api={apiRef.current} />;
      case 'layers': return <LayersPanel api={apiRef.current} tick={tick} setTick={setTick} meta={meta} />;
      default: return null;
    }
  };

  const openPreview = (present) => {
    flushCurrent();
    setPreviewState({ present });
  };
  const goHome = () => {
    flushCurrent();
    saveDesign(designRef.current, thumbs && thumbs[current()?.id]);
    if (saveTimer.current) clearTimeout(saveTimer.current);
    onExit();
  };

  return (
    <div className="editor">
      <TopBar
        design={designRef.current}
        api={apiRef.current}
        onName={(v) => { designRef.current.name = v; schedulePersist(); }}
        canUndo={histRef.current.p > 0}
        canRedo={histRef.current.p < histRef.current.list.length - 1}
        onUndo={undo}
        onRedo={redo}
        zoom={zoom}
        onZoom={setZoom}
        onFit={fitZoom}
        preview={openPreview}
        presenting={previewState?.present}
        onExit={goHome}
      />
      <div className={`editor-body${panel ? '' : ' panel-hidden'}`}>
        <LeftRail panel={panel} onPanel={(id) => setPanel((p) => (p === id ? null : id))} />
        {panel && (
          <div className="panel">
            <div className="panel-head">
              <b>{PANEL_TITLES[panel] || panel}</b>
              <button className="btn icon" onClick={() => setPanel(null)}>×</button>
            </div>
            <div className="panel-body">{panelBody()}</div>
          </div>
        )}
        <div className="stage-wrap" ref={stageWrapRef}>
          <ContextToolbar meta={meta} api={apiRef.current} onOpenPanel={setPanel} />
          <div
            className="canvas-holder"
            style={{ width: Math.round(designRef.current.w * zoom), height: Math.round(designRef.current.h * zoom) }}
          >
            <CanvasStage
              pageInfo={{ w: designRef.current.w, h: designRef.current.h, pageIdx: pageIndex }}
              pageJSON={loadJson}
              zoom={zoom}
              apiRef={apiRef}
              onSelection={setMeta}
              onChange={commit}
            />
          </div>
        </div>
      </div>
      <PageStrip
        pages={PAGES()}
        idx={pageIndex}
        thumbs={thumbs}
        onSelect={switchPage}
        onAdd={addPage}
        onDup={dupPage}
        onDel={() => delPage(pageIndex)}
      />
      {previewState && (
        <PreviewOverlay
          design={designRef.current}
          pages={[...PAGES()]}
          idx={pageIndex}
          presenting={previewState.present}
          onClose={() => setPreviewState(null)}
          onNext={() => switchPage(Math.min(pageIndex + 1, PAGES().length - 1))}
          onPrev={() => switchPage(Math.max(pageIndex - 1, 0))}
        />
      )}
    </div>
  );
}
