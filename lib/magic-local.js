// Magic Studio — local heuristics (offline-friendly, no network calls).
// Originally in legacy lib/ai.js; kept client-side so Design/Palette/Write fallbacks never need a server.
import { hashString, mulberry32, hslToHex, titleCase } from './utils.js';
import { TEMPLATES } from '../data/templates.js';

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
  "Everything you need, nothing you don't.",
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
