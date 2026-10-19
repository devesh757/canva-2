// "Magic" AI layer: offline heuristics + optional BYO OpenAI key (stored locally only).
import { hashString, mulberry32, hslToHex, titleCase } from './utils.js';
import { TEMPLATES } from '../data/templates.js';

export const KEY_STORAGE = 'ls.openai.key';
export const getOpenAIKey = () => localStorage.getItem(KEY_STORAGE) || '';
export const setOpenAIKey = (k) => (k ? localStorage.setItem(KEY_STORAGE, k) : localStorage.removeItem(KEY_STORAGE));

/* ---------------- offline heuristics ---------------- */

const CAT_KEYWORDS = [
  ['social', ['social', 'instagram', 'post', 'quote', 'meme', 'promo']],
  ['story', ['story', 'reel', 'tiktok', 'shorts', 'vertical']],
  ['poster', ['poster', 'event', 'festival', 'concert', 'movie']],
  ['presentation', ['pitch', 'deck', 'slides', 'presentation', 'review', 'report']],
  ['invitation', ['invite', 'invitation', 'wedding', 'party', 'birthday', 'rsvp']],
  ['logo', ['logo', 'brand', 'wordmark', 'badge', 'monogram']],
  ['business card', ['business card', 'contact', 'card']],
  ['web banner', ['banner', 'header', 'hero', 'ad']],
  ['resume', ['resume', 'cv', 'job', 'apply']],
  ['flyer', ['flyer', 'meetup', 'announce', 'workshop']],
  ['video cover', ['youtube', 'video', 'thumbnail', 'cover']],
  ['greeting card', ['greeting', 'card', 'thanks', 'congrats', 'holiday']],
];

// Score templates against a prompt; returns ranked template list.
export function magicDesigns(prompt = '') {
  const p = prompt.toLowerCase();
  const scored = TEMPLATES.map((t) => {
    let score = 0;
    for (const [cat, words] of CAT_KEYWORDS) {
      if (t.cat.toLowerCase() === cat) {
        for (const w of words) if (p.includes(w)) score += 6;
      }
    }
    for (const w of p.split(/\s+/)) {
      if (w.length < 3) continue;
      if (t.name.toLowerCase().includes(w)) score += 4;
      if (t.cat.toLowerCase().includes(w)) score += 3;
    }
    score += hashString(p + t.id) % 3; // stable tie-breaker so results feel varied
    return { tpl: t, score };
  }).sort((a, b) => b.score - a.score);
  return scored.slice(0, 6).map((r) => r.tpl);
}

// Stable 5-color palettes derived from the prompt (combo harmonies).
export function magicPalettes(prompt = '') {
  const seed = hashString(prompt || 'spice');
  const rnd = mulberry32(seed);
  const palettes = [];
  for (let i = 0; i < 4; i++) {
    const h = Math.round(rnd() * 360);
    const mode = i % 3;
    const spread = mode === 0 ? [0, 180, 18, 198, 36] : mode === 1 ? [0, 24, 48, 210, 228] : [0, 120, 240, 60, 180];
    const light = [32, 62, 18, 78, 50];
    const sat = [72, 68, 80, 45, 65];
    const cells = spread.map((d, j) => hslToHex(h + d + i * 40, sat[j], light[j]));
    palettes.push(cells);
  }
  return palettes;
}

// Offline copywriter: headlines / subheads built around the prompt.
const HOOKS = [
  (t) => `${t} that actually ships.`,
  (t) => `Meet the new ${t}`,
  (t) => `${t}, minus the busywork`,
  (t) => `Why everyone's talking about ${t}`,
  (t) => `The ${t} playbook`,
  (t) => `${t}: behind the scenes`,
  (t) => `Small team. Big ${t}.`,
];
const SUBS = [
  'Fresh ideas, shipped weekly.',
  'Everything you need, nothing you don’t.',
  'Built for maker-speed teams.',
  'Zero fluff. All signal.',
  'From draft to done in minutes.',
];
export function magicWriteLocal(prompt = '') {
  const t = titleCase((prompt || 'a better design flow').replace(/^(write|make|generate|create)\s+(a|an|the)?\s*/i, '').slice(0, 42).trim() || 'Design Day');
  const seed = hashString(prompt || t);
  const rnd = mulberry32(seed);
  const headline = HOOKS[seed % HOOKS.length](t);
  const sub = SUBS[(seed >> 3) % SUBS.length];
  const caption = `✨ ${t}: ${sub} — more soon.`;
  return { headline, sub, caption };
}

/* ---------------- OpenAI (BYO key) ---------------- */

async function openaiFetch(key, url, body) {
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${key}` },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    let detail = '';
    try { detail = (await res.json()).error?.message || ''; } catch { /* ignore */ }
    throw new Error(`OpenAI ${res.status}: ${detail || res.statusText}`);
  }
  return res.json();
}

export async function openaiText(key, prompt) {
  const data = await openaiFetch(key, 'https://api.openai.com/v1/chat/completions', {
    model: 'gpt-4o-mini',
    messages: [
      { role: 'system', content: 'You are a punchy copywriter for social graphics. Reply with one short headline, one subline, and one caption separated by newlines. No extra commentary.' },
      { role: 'user', content: prompt },
    ],
    max_tokens: 120,
  });
  return data.choices?.[0]?.message?.content?.trim() || '';
}

export async function openaiImage(key, prompt, size = '1024x1024') {
  // gpt-image-1 returns b64_json natively → no canvas taint on export.
  try {
    const data = await openaiFetch(key, 'https://api.openai.com/v1/images/generations', { model: 'gpt-image-1', prompt, size, n: 1 });
    const b64 = data.data?.[0]?.b64_json;
    if (!b64) throw new Error('no image data');
    return `data:image/png;base64,${b64}`;
  } catch (e) {
    // Fallback to dall-e-3 which explicitly supports b64_json.
    if (/gpt-image-1|unknown model|model_not_found/i.test(String(e))) {
      const data = await openaiFetch(key, 'https://api.openai.com/v1/images/generations', {
        model: 'dall-e-3', prompt, size: '1024x1024', n: 1, response_format: 'b64_json',
      });
      const b64 = data.data?.[0]?.b64_json;
      if (!b64) throw new Error('no image data');
      return `data:image/png;base64,${b64}`;
    }
    throw e;
  }
}
