// Canvas engine — wraps Fabric.js v6 and exposes an imperative editing API.
// All original code. Snap guides are ephemeral Line objects excluded from history.
import { useEffect, useRef } from 'react';
import * as fabric from 'fabric';
import { SHAPES } from '../data/shapes.js';
import { ensureFont } from '../data/fonts.js';
import { toast } from '../lib/utils.js';

const CONTROL_STYLE = {
  cornerColor: '#ffffff',
  cornerStrokeColor: '#6434e9',
  borderColor: '#6434e9',
  cornerStyle: 'circle',
  cornerSize: 12,
  transparentCorners: false,
  borderScaleFactor: 1.4,
  lockScalingFlip: true,
};

const FRAME_FILL = '#e9e4fb';
const FRAME_STROKE = '#8b7bd8';

export function kindOf(obj) {
  if (!obj) return 'none';
  if (obj instanceof fabric.Textbox || obj instanceof fabric.IText || obj instanceof fabric.Text) return 'text';
  if (obj instanceof fabric.FabricImage) return 'image';
  if (obj instanceof fabric.Rect) return 'rect';
  if (obj instanceof fabric.Ellipse || obj instanceof fabric.Circle) return 'circle';
  if (obj instanceof fabric.Path || obj instanceof fabric.Polygon) return 'path';
  if (obj instanceof fabric.Line) return 'line';
  return 'shape';
}

const isGuide = (o) => !!o && !!o.__guide;
const isFrameObj = (o) => !!o && !!o.strokeDashArray && o.stroke === FRAME_STROKE;

function placeCenter(obj, page) {
  obj.set({ originX: 'center', originY: 'center' });
  obj.setPositionByOrigin(new fabric.Point(page.w / 2, page.h / 2), 'center', 'center');
  obj.setCoords();
}

function placeTL(obj, x, y) {
  obj.set({ originX: 'left', originY: 'top' });
  obj.setPositionByOrigin(new fabric.Point(x, y), 'left', 'top');
  obj.setCoords();
}

function withAlpha(hex, a) {
  const h = String(hex || '#000000').replace('#', '');
  const v = h.length === 3 ? h.split('').map((c) => c + c).join('') : h;
  const r = parseInt(v.slice(0, 2), 16);
  const g = parseInt(v.slice(2, 4), 16);
  const b = parseInt(v.slice(4, 6), 16);
  if ([r, g, b].some(Number.isNaN)) return hex;
  return `rgba(${r},${g},${b},${a})`;
}

export default function CanvasStage({ pageInfo, pageJSON, zoom, apiRef, onSelection, onChange }) {
  const elRef = useRef(null);
  const canvasRef = useRef(null);
  const guidesRef = useRef([]);
  const loadingRef = useRef(false);
  const eraseRef = useRef(false);
  const pageInfoRef = useRef(pageInfo);
  const cbRef = useRef({});
  const zoomRef = useRef(zoom);
  pageInfoRef.current = pageInfo;
  cbRef.current = { onSelection, onChange };
  zoomRef.current = zoom;

  /* -------- init once -------- */
  useEffect(() => {
    const page = pageInfoRef.current;
    const canvas = new fabric.Canvas(elRef.current, {
      width: page.w,
      height: page.h,
      backgroundColor: '#ffffff',
      preserveObjectStacking: true,
      selectionColor: 'rgba(100,52,233,0.08)',
      selectionBorderColor: '#6434e9',
      selectionLineWidth: 1,
    });
    canvas.enableRetinaScaling = true;
    canvasRef.current = canvas;
    if (fabric.InteractiveFabricObject?.Styles) {
      Object.assign(fabric.InteractiveFabricObject.Styles, CONTROL_STYLE);
    }

    const emitChange = (e) => {
      if (loadingRef.current) return;
      if (e && isGuide(e.target)) return;
      cbRef.current.onChange?.();
    };
    const emitSelection = () => cbRef.current.onSelection?.(buildMeta(canvas));

    canvas.on('object:added', emitChange);
    canvas.on('object:removed', emitChange);
    canvas.on('object:modified', () => { clearGuides(canvas, guidesRef); emitChange(); emitSelection(); });
    canvas.on('path:created', emitChange);
    canvas.on('text:changed', emitChange);
    canvas.on('selection:created', emitSelection);
    canvas.on('selection:updated', emitSelection);
    canvas.on('selection:cleared', emitSelection);
    canvas.on('object:moving', (e) => {
      if (e.target && !isGuide(e.target)) snapMove(canvas, e.target, pageInfoRef.current, guidesRef);
    });
    canvas.on('mouse:up', () => clearGuides(canvas, guidesRef));
    canvas.on('before:selection:cleared', () => clearGuides(canvas, guidesRef));
    // object-eraser: when armed, clicking an object deletes it (fabric v6 has no built-in eraser)
    canvas.on('mouse:down', (e) => {
      if (eraseRef.current && e.target && !isGuide(e.target)) {
        canvas.remove(e.target);
        canvas.requestRenderAll();
        cbRef.current.onChange?.();
      }
    });

    const onWheel = (e) => {
      if (e.ctrlKey) {
        e.preventDefault();
        const z = Math.min(4, Math.max(0.06, zoomRef.current * (e.deltaY < 0 ? 1.06 : 0.94)));
        canvasRef.current?.setZoom(z);
        const pg = pageInfoRef.current;
        canvasRef.current?.setDimensions({ width: Math.round(pg.w * z), height: Math.round(pg.h * z) });
        canvasRef.current?.requestRenderAll();
        ctxObj.onZoom?.(z);
      }
    };
    canvas.upperCanvasEl.addEventListener('wheel', onWheel, { passive: false });

    const ctxObj = {
      canvas: () => canvasRef.current,
      page: () => pageInfoRef.current,
      loading: loadingRef,
      cb: cbRef,
      onZoom: (z) => window.dispatchEvent(new CustomEvent('ls-zoom', { detail: z })),
      erase: eraseRef,
    };
    attachAPI(apiRef, ctxObj);

    return () => {
      canvas.dispose();
      canvasRef.current = null;
      if (apiRef) apiRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /* -------- page JSON changes (page switch / undo / load) -------- */
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !pageJSON) return;
    let stale = false;
    loadingRef.current = true;
    canvas.loadFromJSON(pageJSON).then(() => {
      if (stale) return;
      canvas.backgroundColor = pageJSON.background || '#ffffff';
      canvas.discardActiveObject();
      canvas.renderAll();
      loadingRef.current = false;
      cbRef.current.onSelection?.(buildMeta(canvas));
    });
    return () => { stale = true; };
  }, [pageJSON]);

  /* -------- zoom -------- */
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    canvas.setZoom(zoom);
    canvas.setDimensions({ width: Math.round(pageInfo.w * zoom), height: Math.round(pageInfo.h * zoom) });
    canvas.requestRenderAll();
  }, [zoom, pageInfo.w, pageInfo.h]);

  return (
    <div style={{ flex: 'none' }}>
      <canvas ref={elRef} />
    </div>
  );
}

function buildMeta(canvas) {
  const actives = canvas ? canvas.getActiveObjects() : [];
  if (!actives.length) return { count: 0, kinds: [] };
  const kinds = [...new Set(actives.map((o) => kindOf(o)))];
  const single = actives.length === 1 ? actives[0] : null;
  const kind = kindOf(single);
  return {
    count: actives.length,
    kinds,
    single,
    text: kind === 'text' ? single : null,
    image: kind === 'image' ? single : null,
    shapeLike: single && ['rect', 'path', 'circle', 'line', 'shape'].includes(kind) ? single : null,
    isFrame: isFrameObj(single) || (single && ((single.fill === FRAME_FILL) && (single.stroke === FRAME_STROKE))),
  };
}

function objLabel(o) {
  const kind = kindOf(o);
  if (kind === 'text') {
    const s = (o.text || '').trim().replace(/\s+/g, ' ').slice(0, 16);
    return s ? `"${s}"` : 'Text';
  }
  if (kind === 'image') return 'Image';
  if (kind === 'rect') return 'Rectangle';
  if (kind === 'circle') return 'Circle';
  if (kind === 'line') return 'Line';
  if (kind === 'path') return 'Shape';
  return 'Shape';
}

function clearGuides(canvas, guidesRef) {
  guidesRef.current.forEach((g) => canvas.remove(g));
  guidesRef.current = [];
}

function snapMove(canvas, target, page, guidesRef) {
  const eps = 8 / (canvas.getZoom() || 1);
  const others = canvas.getObjects().filter((o) => o !== target && !isGuide(o));
  const w = target.getScaledWidth();
  const h = target.getScaledHeight();
  const l = target.get('left');
  const t = target.get('top');
  const myX = [l, l + w / 2, l + w];
  const myY = [t, t + h / 2, t + h];
  const allX = [0, page.w / 2, page.w, ...others.flatMap((o) => [o.get('left'), o.get('left') + o.getScaledWidth() / 2, o.get('left') + o.getScaledWidth()])];
  const allY = [0, page.h / 2, page.h, ...others.flatMap((o) => [o.get('top'), o.get('top') + o.getScaledHeight() / 2, o.get('top') + o.getScaledHeight()])];

  let snapX = null;
  let snapY = null;
  outerX: for (const mx of myX) {
    for (const v of allX) {
      if (Math.abs(mx - v) < eps) { target.left += v - mx; snapX = v; break outerX; }
    }
  }
  outerY: for (const my of myY) {
    for (const v of allY) {
      if (Math.abs(my - v) < eps) { target.top += v - my; snapY = v; break outerY; }
    }
  }

  clearGuides(canvas, guidesRef);
  const mk = (pts) => {
    const g = new fabric.Line(pts, { stroke: '#e5484d', strokeWidth: 1, selectable: false, evented: false, __guide: true, objectCaching: false });
    guidesRef.current.push(g);
    canvas.add(g);
  };
  if (snapX != null) mk([snapX, -5000, snapX, page.h + 5000]);
  if (snapY != null) mk([-5000, snapY, page.w + 5000, snapY]);
  if (snapX != null || snapY != null) canvas.requestRenderAll();
}

/* ---------------- imperative API ---------------- */
function attachAPI(apiRef, ctx) {
  if (!apiRef) return;
  const C = () => ctx.canvas();
  const P = () => ctx.page();
  let drawingMode = 'select';
  let brushColor = '#29264d';
  let brushWidth = 8;

  const setDrawingModeSilently = (mode) => { drawingMode = mode; };

  const api = {
    /* ---- serialization ---- */
    getJSON() {
      const canvas = C();
      if (!canvas) return { objects: [], background: '#ffffff' };
      return {
        objects: canvas.getObjects().filter((o) => !isGuide(o)).map((o) => o.toObject(['visible', 'selectable', 'evented'])),
        background: canvas.backgroundColor || '#ffffff',
      };
    },
    async loadJSON(json) {
      const canvas = C();
      if (!canvas) return;
      ctx.loading.current = true;
      try {
        await canvas.loadFromJSON({ objects: json.objects || [], background: json.background || '#ffffff' });
        canvas.backgroundColor = json.background || '#ffffff';
        canvas.discardActiveObject();
        canvas.renderAll();
      } finally {
        ctx.loading.current = false;
      }
    },
    setBg(color) {
      const canvas = C();
      if (!canvas) return;
      canvas.backgroundColor = color || '#ffffff';
      canvas.requestRenderAll();
      api.forceChange();
    },
    getBg() { return C()?.backgroundColor || '#ffffff'; },
    forceChange() { ctx.cb.current.onChange?.(); },

    /* ---- raw-object access (Layers panel, frames, magic) ---- */
    canvas() { return C(); },
    getObjects() {
      const canvas = C();
      if (!canvas) return [];
      return canvas.getObjects().filter((o) => !isGuide(o)).map((o) => ({
        obj: o,
        kind: kindOf(o),
        label: objLabel(o),
      }));
    },
    setActive(obj) {
      const canvas = C();
      if (!canvas || !obj) return;
      canvas.setActiveObject(obj);
      canvas.requestRenderAll();
    },
    setObjProp(obj, patch) {
      const canvas = C();
      if (!canvas || !obj) return;
      obj.set(patch);
      obj.setCoords();
      canvas.requestRenderAll();
      api.forceChange();
    },
    removeObject(obj) {
      const canvas = C();
      if (!canvas || !obj) return;
      canvas.remove(obj);
      canvas.requestRenderAll();
      api.forceChange();
    },
    bringInFrontOf(obj) {
      const canvas = C();
      if (!canvas) return;
      canvas.bringObjectToFront(obj);
      canvas.requestRenderAll();
      api.forceChange();
    },
    sendToBack(obj) {
      const canvas = C();
      if (!canvas) return;
      canvas.sendObjectToBack(obj);
      canvas.requestRenderAll();
      api.forceChange();
    },
    clearGradientBg() {
      const canvas = C();
      if (!canvas) return;
      canvas.getObjects().filter((o) => o.fill && typeof o.fill === 'object' && o.fill.type).forEach((o) => canvas.remove(o));
      canvas.requestRenderAll();
      api.forceChange();
    },
    addGradientBg(g) {
      const canvas = C();
      const page = P();
      if (!canvas) return;
      api.clearGradientBg();
      const rect = new fabric.Rect({
        width: page.w, height: page.h, originX: 'left', originY: 'top',
        fill: new fabric.Gradient({
          type: g.dir === 'v' ? 'linear' : g.dir === 'radial' ? 'radial' : 'linear',
          coords: g.dir === 'v'
            ? { x1: 0, y1: 0, x2: 0, y2: 1 }
            : g.dir === 'diag'
              ? { x1: 0, y1: 0, x2: 1, y2: 1 }
              : g.dir === 'radial' ? { x1: 0, y1: 0, x2: 0, y2: 0 } : { x1: 0, y1: 0, x2: 1, y2: 0 },
          gradientUnits: 'percentage',
          colorStops: g.stops,
        }),
        selectable: false, evented: false,
        ...CONTROL_STYLE,
      });
      placeTL(rect, 0, 0);
      canvas.add(rect);
      canvas.sendObjectToBack(rect);
      canvas.requestRenderAll();
      api.forceChange();
    },


    /* ---- selection ---- */
    getMeta() { return buildMeta(C()); },
    selection() { return C()?.getActiveObjects() || []; },
    deleteSelected() {
      const canvas = C();
      if (!canvas) return;
      const a = canvas.getActiveObjects();
      if (!a.length) return;
      canvas.discardActiveObject();
      a.forEach((o) => canvas.remove(o));
      canvas.requestRenderAll();
      api.forceChange();
    },
    async duplicateSelected() {
      const canvas = C();
      if (!canvas) return;
      const actives = canvas.getActiveObjects();
      if (!actives.length) return;
      canvas.discardActiveObject();
      const clones = [];
      for (const o of actives) {
        try {
          const c = await o.clone(['visible', 'selectable', 'evented']);
          c.set({ left: o.get('left') + 24, top: o.get('top') + 24 });
          clones.push(c);
          canvas.add(c);
        } catch { /* skip */ }
      }
      if (clones.length > 1) {
        const sel = new fabric.ActiveSelection(clones, { canvas });
        canvas.setActiveObject(sel);
      } else if (clones[0]) {
        canvas.setActiveObject(clones[0]);
      }
      canvas.requestRenderAll();
    },
    layer(dir) {
      const canvas = C();
      const o = canvas?.getActiveObject();
      if (!o) return;
      if (dir === 'front') canvas.bringObjectToFront(o);
      if (dir === 'back') canvas.sendObjectToBack(o);
      if (dir === 'forward') canvas.bringObjectForward(o);
      if (dir === 'backward') canvas.sendObjectBackwards(o);
      canvas.requestRenderAll();
      api.forceChange();
    },
    nudge(dx, dy) {
      const canvas = C();
      if (!canvas) return;
      canvas.getActiveObjects().forEach((o) => {
        o.set({ left: o.get('left') + dx, top: o.get('top') + dy });
        o.setCoords();
      });
      canvas.requestRenderAll();
    },
    groupSelected() {
      const canvas = C();
      if (!canvas) return;
      const active = canvas.getActiveObject();
      if (!active || active.getObjects?.().length < 2) { toast('Select multiple objects to group'); return; }
      const objs = active.getObjects();
      try {
        canvas.discardActiveObject();
        const g = new fabric.Group(objs, { ...CONTROL_STYLE });
        objs.forEach((o) => canvas.remove(o));
        canvas.add(g);
        canvas.setActiveObject(g);
        canvas.requestRenderAll();
        api.forceChange();
      } catch (e) {
        toast(`Grouping failed: ${e.message}`);
      }
    },
    ungroupSelected() {
      const canvas = C();
      const g = canvas?.getActiveObject();
      if (!g || !(g instanceof fabric.Group) || !g.getObjects?.().length) {
        toast('Select a group to ungroup');
        return;
      }
      try {
        const objs = g.getObjects();
        const gm = g.calcTransformMatrix();
        canvas.discardActiveObject();
        const restored = objs.map((o) => {
          const m = fabric.util.multiplyTransformMatrices(gm, o.calcTransformMatrix());
          const d = fabric.util.qrDecompose(m);
          // canvas-space location of the object's own origin anchor
          const pt = fabric.util.transformPoint(new fabric.Point(0, 0), m);
          o.set({
            angle: d.angle || 0,
            scaleX: d.scaleX || 1,
            scaleY: d.scaleY || 1,
            skewX: d.skewX || 0,
          });
          o.setPositionByOrigin(pt, o.originX || 'left', o.originY || 'top');
          o.setCoords();
          return o;
        });
        canvas.remove(g);
        canvas.add(...restored);
        canvas.setActiveObject(new fabric.ActiveSelection(restored, { canvas }));
        canvas.requestRenderAll();
        api.forceChange();
      } catch (e) {
        toast(`Ungroup failed: ${e.message}`);
      }
    },

    /* ---- object ops ---- */
    set(patch) {
      const canvas = C();
      if (!canvas) return;
      canvas.getActiveObjects().forEach((o) => {
        o.set(patch);
        o.setCoords();
      });
      canvas.requestRenderAll();
      api.forceChange();
    },
    flip(axis) {
      const canvas = C();
      if (!canvas) return;
      canvas.getActiveObjects().forEach((o) => {
        if (axis === 'x') o.set('flipX', !o.flipX);
        else o.set('flipY', !o.flipY);
        o.setCoords();
      });
      canvas.requestRenderAll();
      api.forceChange();
    },
    rotate90() {
      const canvas = C();
      if (!canvas) return;
      canvas.getActiveObjects().forEach((o) => {
        o.rotate((((o.angle || 0) + 90) % 360));
        o.setCoords();
      });
      canvas.requestRenderAll();
      api.forceChange();
    },
    lockSelected(lock) {
      const canvas = C();
      if (!canvas) return;
      canvas.getActiveObjects().forEach((o) => {
        o.set({
          lockMovementX: !!lock, lockMovementY: !!lock,
          lockScalingX: !!lock, lockScalingY: !!lock, lockRotation: !!lock,
        });
        o.setCoords();
      });
      canvas.requestRenderAll();
      api.forceChange();
    },

    /* ---- adding content ---- */
    addText: async ({ text = 'Add text', fontSize = 72, family = 'Inter', weight = 400, color = '#1f1d2b', align = 'left' } = {}) => {
      const canvas = C();
      const page = P();
      if (!canvas) return;
      await ensureFont(family);
      const t = new fabric.Textbox(text, {
        width: page.w * 0.7,
        fontSize,
        fontFamily: family,
        fontWeight: weight,
        fill: color,
        textAlign: align,
        lineHeight: 1.16,
        ...CONTROL_STYLE,
      });
      placeCenter(t, page);
      canvas.add(t);
      canvas.setActiveObject(t);
      canvas.requestRenderAll();
      return t;
    },
    addShape(shapeId) {
      const canvas = C();
      const page = P();
      if (!canvas) return;
      const entry = SHAPES.find((s) => s.id === shapeId) || SHAPES[0];
      const def = entry.def;
      const size = Math.min(page.w, page.h) * 0.3;
      let obj;
      const base = { fill: '#3f3a56', stroke: null, strokeWidth: 0, ...CONTROL_STYLE };
      if (def.kind === 'rect' || def.kind === 'rrect') {
        const r = def.kind === 'rrect' ? Math.min(28, size * 0.12) : 0;
        obj = new fabric.Rect({ width: size, height: size, rx: r, ry: r, ...base });
      } else if (def.kind === 'circle') {
        obj = new fabric.Circle({ radius: size / 2, ...base });
      } else if (def.kind === 'poly') {
        obj = new fabric.Polygon(def.points.map(([x, y]) => ({ x: (x / 100) * size, y: (y / 100) * size })), { ...base });
      } else if (def.kind === 'path') {
        obj = new fabric.Path(def.d, { fill: '#3f3a56', stroke: null, strokeWidth: 0, ...CONTROL_STYLE });
        const s = size / Math.max(obj.width || size, obj.height || size);
        obj.set({ scaleX: s, scaleY: s });
      } else if (def.kind === 'line') {
        obj = new fabric.Line([0, 0, size, 0], { stroke: '#3f3a56', strokeWidth: 8, strokeLineCap: 'round', ...CONTROL_STYLE });
      } else {
        return;
      }
      placeCenter(obj, page);
      canvas.add(obj);
      canvas.setActiveObject(obj);
      canvas.requestRenderAll();
    },
    addFrame(shapeId = 'rect') {
      const canvas = C();
      const page = P();
      if (!canvas) return;
      const size = Math.min(page.w, page.h) * 0.42;
      const style = {
        fill: FRAME_FILL, stroke: FRAME_STROKE, strokeWidth: 2, strokeDashArray: [14, 9],
        ...CONTROL_STYLE,
      };
      let obj;
      if (shapeId === 'circle') obj = new fabric.Circle({ radius: size / 2, ...style });
      else if (shapeId === 'rrect') obj = new fabric.Rect({ width: size, height: size, rx: 24, ry: 24, ...style });
      else obj = new fabric.Rect({ width: size, height: size, ...style });
      placeCenter(obj, page);
      canvas.add(obj);
      canvas.setActiveObject(obj);
      canvas.requestRenderAll();
    },
    addEmoji(ch) {
      const canvas = C();
      const page = P();
      if (!canvas) return;
      const T = fabric.Text || fabric.FabricText || fabric.Textbox;
      const t = new T(ch, { fontSize: Math.min(page.w, page.h) * 0.2, ...CONTROL_STYLE });
      placeCenter(t, page);
      canvas.add(t);
      canvas.setActiveObject(t);
      canvas.requestRenderAll();
    },
    addImage: async (url, { fitPage = 0.7 } = {}) => {
      const canvas = C();
      const page = P();
      if (!canvas) return;
      const sel = canvas.getActiveObject();
      if (sel && isFrameObj(sel)) {
        await api.fillFrame(sel, url);
        return;
      }
      let img;
      try {
        img = await fabric.FabricImage.fromURL(url, { crossOrigin: 'anonymous' }, { ...CONTROL_STYLE });
      } catch {
        toast('Could not load that image');
        return;
      }
      const s = Math.min((page.w * fitPage) / img.width, (page.h * fitPage) / img.height);
      img.set({ scaleX: s, scaleY: s });
      placeCenter(img, page);
      canvas.add(img);
      canvas.setActiveObject(img);
      canvas.requestRenderAll();
    },
    fillFrame: async (frame, url) => {
      const canvas = C();
      if (!canvas) return;
      const idx = canvas.getObjects().indexOf(frame);
      let img;
      try {
        img = await fabric.FabricImage.fromURL(url, { crossOrigin: 'anonymous' }, { ...CONTROL_STYLE });
      } catch {
        toast('Could not load that image');
        return;
      }
      const fw = frame.getScaledWidth();
      const fh = frame.getScaledHeight();
      const s = Math.max(fw / img.width, fh / img.height);
      const kx = frame.scaleX || 1;
      const clip = frame instanceof fabric.Circle
        ? new fabric.Circle({ radius: fw / 2 / s, startAngle: 0, endAngle: Math.PI * 2 })
        : new fabric.Rect({
            width: fw / s,
            height: fh / s,
            rx: frame.rx ? (frame.rx * kx) / s : 0,
            ry: frame.ry ? (frame.ry * kx) / s : 0,
          });
      img.set({ scaleX: s, scaleY: s });
      img.clipPath = clip;
      img.set({ originX: 'center', originY: 'center' });
      img.setPositionByOrigin(frame.getCenterPoint(), 'center', 'center');
      img.angle = frame.angle || 0;
      img.setCoords();
      canvas.remove(frame);
      if (idx >= 0) canvas.insertAt(idx, img);
      else canvas.add(img);
      canvas.setActiveObject(img);
      canvas.requestRenderAll();
    },

    /* ---- text styling ---- */
    setText(patch) {
      const canvas = C();
      if (!canvas) return;
      canvas.getActiveObjects().forEach((o) => {
        if (kindOf(o) !== 'text') return;
        o.set(patch);
        if (patch.fontFamily) o.initDimensions?.();
        o.setCoords();
      });
      canvas.requestRenderAll();
      api.forceChange();
    },
    async setFontFamily(family) {
      await ensureFont(family);
      api.setText({ fontFamily: family });
    },
    textEffect(kind, on) {
      const canvas = C();
      const o = canvas?.getActiveObject();
      if (!o || kindOf(o) !== 'text') return;
      if (kind === 'shadow') {
        o.set('shadow', on
          ? new fabric.Shadow({ color: 'rgba(15,10,40,0.45)', blur: Math.max(8, (o.fontSize || 40) * 0.28), offsetX: 0, offsetY: (o.fontSize || 40) * 0.12 })
          : null);
      } else if (kind === 'hollow') {
        if (on) o.__fillBefore = o.fill && o.fill !== 'transparent' ? o.fill : (o.__fillBefore || '#1f1d2b');
        o.set({
          fill: on ? 'transparent' : (o.__fillBefore || '#1f1d2b'),
          stroke: on ? (o.__fillBefore || '#1f1d2b') : '',
          strokeWidth: on ? Math.max(2, (o.fontSize || 40) * 0.05) : 0,
        });
      }
      o.setCoords();
      canvas.requestRenderAll();
      api.forceChange();
    },

    /* ---- image filters ---- */
    applyFilter(filters) {
      const canvas = C();
      const o = canvas?.getActiveObject();
      if (!o || kindOf(o) !== 'image') return;
      const F = fabric.filters || {};
      if (!F.Brightness) { toast('Filters unavailable in this fabric build'); return; }
      const list = [];
      if (filters.brightness) list.push(new F.Brightness({ brightness: filters.brightness }));
      if (filters.contrast) list.push(new F.Contrast({ contrast: filters.contrast }));
      if (filters.saturation) list.push(new F.Saturation({ saturation: filters.saturation }));
      if (filters.blur) list.push(new F.Blur({ blur: filters.blur }));
      if (filters.sepia) list.push(new F.Sepia());
      if (filters.grayscale) list.push(new F.Grayscale({ mode: 'luminosity' }));
      o.filters = list;
      o.applyFilters();
      canvas.requestRenderAll();
      api.forceChange();
    },
    clearFilters() {
      const canvas = C();
      const o = canvas?.getActiveObject();
      if (!o || kindOf(o) !== 'image') return;
      o.filters = [];
      o.applyFilters();
      canvas.requestRenderAll();
      api.forceChange();
    },

    /* ---- drawing ---- */
    setDrawing(mode) {
      const canvas = C();
      if (!canvas) return;
      ctx.erase.current = mode === 'eraser';
      drawingMode = mode;
      canvas.isDrawingMode = mode === 'pen' || mode === 'highlight';
      canvas.selection = mode === 'select';
      const interactive = mode === 'select' || mode === 'eraser';
      canvas.forEachObject((o) => {
        const en = interactive && !isGuide(o);
        o.selectable = en;
        o.evented = en;
      });
      if (mode === 'pen') {
        canvas.freeDrawingBrush = new fabric.PencilBrush(canvas);
        canvas.freeDrawingBrush.color = brushColor;
        canvas.freeDrawingBrush.width = brushWidth;
        if ('decimate' in canvas.freeDrawingBrush) canvas.freeDrawingBrush.decimate = 2;
      }
      if (mode === 'highlight') {
        canvas.freeDrawingBrush = new fabric.PencilBrush(canvas);
        canvas.freeDrawingBrush.color = withAlpha(brushColor, 0.5);
        canvas.freeDrawingBrush.width = Math.max(16, brushWidth * 2.6);
        if ('decimate' in canvas.freeDrawingBrush) canvas.freeDrawingBrush.decimate = 2;
      }
      canvas.upperCanvasEl.style.cursor = ctx.erase.current ? 'crosshair' : '';
      canvas.requestRenderAll();
    },
    setBrush({ color, width }) {
      if (color) brushColor = color;
      if (width) brushWidth = width;
      // re-apply for the current drawing mode
      api.setDrawing(drawingMode);
    },
    hookZoom(fn) { ctx.onZoom = fn; },
    drawingMode() { return drawingMode; },

    /* ---- alignment ---- */
    align(where) {
      const canvas = C();
      if (!canvas) return;
      const actives = canvas.getActiveObjects();
      if (!actives.length) return;
      const page = P();
      const multi = actives.length > 1;
      let L = 0, T = 0, W = page.w, H = page.h;
      if (multi) {
        L = Math.min(...actives.map((o) => o.get('left')));
        T = Math.min(...actives.map((o) => o.get('top')));
        W = Math.max(...actives.map((o) => o.get('left') + o.getScaledWidth())) - L;
        H = Math.max(...actives.map((o) => o.get('top') + o.getScaledHeight())) - T;
      }
      actives.forEach((o) => {
        const ow = o.getScaledWidth();
        const oh = o.getScaledHeight();
        const ol = o.get('left');
        const ot = o.get('top');
        if (where === 'left') o.set('left', L);
        if (where === 'right') o.set('left', L + W - ow);
        if (where === 'centerX') o.set('left', L + (W - ow) / 2);
        if (where === 'top') o.set('top', T);
        if (where === 'bottom') o.set('top', T + H - oh);
        if (where === 'centerY') o.set('top', T + (H - oh) / 2);
        o.setCoords();
      });
      canvas.requestRenderAll();
      api.forceChange();
    },
    distribute(axis) {
      const canvas = C();
      const os = [...(canvas?.getActiveObjects() || [])];
      if (os.length < 3) { toast('Select 3+ objects to distribute'); return; }
      const metric = axis === 'x' ? 'left' : 'top';
      const dim = axis === 'x' ? (o) => o.getScaledWidth() : (o) => o.getScaledHeight();
      os.sort((a, b) => a.get(metric) - b.get(metric));
      const first = os[0];
      const last = os[os.length - 1];
      const span = (last.get(metric) + dim(last)) - first.get(metric);
      const need = os.reduce((s, o) => s + dim(o), 0);
      const gap = (span - need) / (os.length - 1);
      let cursor = first.get(metric);
      os.forEach((o) => {
        o.set(metric, cursor);
        cursor += dim(o) + gap;
        o.setCoords();
      });
      canvas.requestRenderAll();
      api.forceChange();
    },

    /* ---- templates ---- */
    applyTemplate: async (tpl) => {
      const canvas = C();
      const page = P();
      if (!canvas) return;
      ctx.loading.current = true;
      try {
        canvas.discardActiveObject();
        clearGuides(canvas, guidesRef);
        canvas.getObjects().slice().forEach((o) => canvas.remove(o));
        canvas.backgroundColor = tpl.bg || '#ffffff';
        // Fit template coordinates to the current page size (uniform scale, centered).
        const s = Math.min(page.w / tpl.size.w, page.h / tpl.size.h);
        const ox = (page.w - tpl.size.w * s) / 2;
        const oy = (page.h - tpl.size.h * s) / 2;
        for (const itRaw of tpl.items) {
          const it = { ...itRaw };
          it.x = (itRaw.x || 0) * s + ox;
          it.y = (itRaw.y || 0) * s + oy;
          it.w = (itRaw.w || 0) * s;
          it.h = (itRaw.h || itRaw.w || 0) * s;
          if (itRaw.size) it.size = itRaw.size * s;
          if (itRaw.ls) it.ls = itRaw.ls * s;
          if (itRaw.rx) it.rx = itRaw.rx * s;
          it.sw = (itRaw.sw || 0) * s;
          const obj = await buildTemplateObject(it, page);
          if (obj) canvas.add(obj);
        }
        canvas.renderAll();
      } finally {
        ctx.loading.current = false;
      }
      api.forceChange();
    },
  };

  Object.assign(apiRef.current || (apiRef.current = {}), api);
}

/* Build a fabric object from a template descriptor. */
async function buildTemplateObject(it, page) {
  let obj = null;
  if (it.k === 'text') {
    await ensureFont(it.family || 'Inter');
    obj = new fabric.Textbox(it.text, {
      width: it.w,
      fontSize: it.size,
      fontFamily: it.family || 'Inter',
      fontWeight: it.weight || 400,
      fill: it.color,
      textAlign: it.align || 'left',
      lineHeight: it.lh || 1.15,
      charSpacing: it.ls || 0,
      ...CONTROL_STYLE,
    });
    placeTL(obj, it.x, it.y);
  } else if (it.k === 'rect' || it.k === 'rrect') {
    obj = new fabric.Rect({
      width: it.w, height: it.h, rx: it.rx || 0, ry: it.rx || 0,
      fill: it.fill || 'transparent',
      stroke: it.stroke || null, strokeWidth: it.sw || 0,
      ...CONTROL_STYLE,
    });
    placeTL(obj, it.x, it.y);
  } else if (it.k === 'circle') {
    obj = new fabric.Ellipse({ rx: it.w / 2, ry: it.h / 2, fill: it.fill, ...CONTROL_STYLE });
    obj.set({ originX: 'center', originY: 'center' });
    obj.setPositionByOrigin(new fabric.Point(it.x + it.w / 2, it.y + it.h / 2), 'center', 'center');
  } else if (it.k === 'poly' || it.k === 'star5') {
    const id = it.shapeId || (it.k === 'star5' ? 'star' : null);
    const def = SHAPES.find((s) => s.id === id)?.def || SHAPES.find((s) => s.id === 'star').def;
    if (def.kind === 'poly') {
      obj = new fabric.Polygon(
        def.points.map(([x, y]) => ({ x: (x / 100) * it.w, y: (y / 100) * it.h })),
        { fill: it.fill, ...CONTROL_STYLE },
      );
      placeTL(obj, it.x, it.y);
    }
  } else if (it.k === 'path') {
    obj = new fabric.Path(it.d, { fill: it.fill, ...CONTROL_STYLE });
    const s = Math.max(it.w / (obj.width || 100), (it.h || it.w) / (obj.height || 100));
    obj.set({ scaleX: s, scaleY: s });
    placeTL(obj, it.x, it.y);
  } else if (it.k === 'line') {
    obj = new fabric.Line(
      [it.x, it.y, it.x + (it.w || 200), it.y + (it.h || 0)],
      { stroke: it.fill || '#333', strokeWidth: it.sw || 6, strokeLineCap: 'round', ...CONTROL_STYLE },
    );
  }
  if (obj) {
    if (it.opacity != null) obj.set('opacity', it.opacity);
    if (it.rot) obj.rotate(it.rot);
    obj.setCoords();
  }
  return obj;
}
