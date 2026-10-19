// Design persistence — localStorage-backed design library.
import { uid, toast } from './utils.js';
import { sizeById } from '../data/sizes.js';

const INDEX_KEY = 'ls.index';

export const blankPage = (w, h) => ({ id: uid(), json: { objects: [], background: '#ffffff' } });

export function newDesign(sizeId, opts = {}) {
  const s = sizeById(sizeId);
  return {
    id: uid(),
    name: opts.name || `Untitled ${s.name}`,
    sizeId,
    w: s.w,
    h: s.h,
    pages: [blankPage(s.w, s.h)],
    updatedAt: Date.now(),
  };
}

export function listDesigns() {
  try {
    return JSON.parse(localStorage.getItem(INDEX_KEY) || '[]');
  } catch { return []; }
}

function putIndex(meta) {
  const idx = listDesigns().filter((d) => d.id !== meta.id);
  idx.unshift(meta);
  localStorage.setItem(INDEX_KEY, JSON.stringify(idx.slice(0, 30)));
}

export function getDesign(id) {
  try {
    return JSON.parse(localStorage.getItem('ls.design.' + id) || 'null');
  } catch { return null; }
}

export function saveDesign(design, thumb = null) {
  if (!design) return;
  design.updatedAt = Date.now();
  // Pages may hold big object arrays; drop client-only caches before saving.
  const slim = { ...design, _thumb: undefined };
  try {
    localStorage.setItem('ls.design.' + design.id, JSON.stringify(slim));
    putIndex({
      id: design.id, name: design.name, sizeId: design.sizeId,
      w: design.w, h: design.h, updatedAt: design.updatedAt,
      thumb: thumb || localStorage.getItem('ls.thumb.' + design.id) || null,
    });
    if (thumb) localStorage.setItem('ls.thumb.' + design.id, thumb);
  } catch (e) {
    toast('Storage is full — old designs may not be retained. Download important work as JSON.', 'err');
  }
}

export function deleteDesign(id) {
  localStorage.removeItem('ls.design.' + id);
  localStorage.removeItem('ls.thumb.' + id);
  localStorage.setItem(INDEX_KEY, JSON.stringify(listDesigns().filter((d) => d.id !== id)));
}

export function importDesignFile(json) {
  if (!json || !Array.isArray(json.pages) || !json.w || !json.h) return null;
  return { ...json, id: json.id || uid() };
}
