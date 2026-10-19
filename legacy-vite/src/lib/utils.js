export const uid = () => Math.random().toString(36).slice(2, 10) + Date.now().toString(36).slice(-4);
export const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
export const round2 = (v) => Math.round(v * 100) / 100;

export function hashString(str = '') {
  let h = 2166136261;
  for (let i = 0; i < str.length; i++) { h ^= str.charCodeAt(i); h = Math.imul(h, 16777619); }
  return Math.abs(h >>> 0);
}

export function mulberry32(seed) {
  let a = seed >>> 0;
  return () => {
    a |= 0; a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export const toast = (msg, kind = '') => {
  window.dispatchEvent(new CustomEvent('ls-toast', { detail: { msg, kind, id: uid() } }));
};

export const titleCase = (s = '') =>
  s.replace(/\w\S*/g, (t) => t.charAt(0).toUpperCase() + t.slice(1));

// ---- color helpers (original implementations) ----
export function hslToHex(h, s, l) {
  h = ((h % 360) + 360) % 360; s /= 100; l /= 100;
  const k = (n) => (n + h / 30) % 12;
  const a = s * Math.min(l, 1 - l);
  const f = (n) => l - a * Math.max(-1, Math.min(k(n) - 3, Math.min(9 - k(n), 1)));
  const to255 = (x) => Math.round(255 * x).toString(16).padStart(2, '0');
  return `#${to255(f(0))}${to255(f(8))}${to255(f(4))}`.toUpperCase();
}

export function hexToRgb(hex = '#000000') {
  const h = hex.replace('#', '');
  const v = h.length === 3 ? h.split('').map((c) => c + c).join('') : h;
  return { r: parseInt(v.slice(0, 2), 16), g: parseInt(v.slice(2, 4), 16), b: parseInt(v.slice(4, 6), 16) };
}

// Fetch a remote image and convert to a data URL so the export canvas never taints.
export async function loadRemoteImageAsDataURL(url) {
  const res = await fetch(url, { mode: 'cors' });
  if (!res.ok) throw new Error(`Image fetch failed (${res.status})`);
  const blob = await res.blob();
  if (blob.size > 8_000_000) throw new Error('Image too large');
  return await new Promise((resolve, reject) => {
    const fr = new FileReader();
    fr.onload = () => resolve(fr.result);
    fr.onerror = reject;
    fr.readAsDataURL(blob);
  });
}

export const fmtDate = (ts) =>
  new Date(ts).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
