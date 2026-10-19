// Original template presets — designed from scratch for Libre Studio.
// An item's coordinates are in page pixels.
import { fontFallback } from './fonts.js';
import { sizeById } from './sizes.js';
import { SHAPES } from './shapes.js';

const RAW_TEMPLATES = [
  {
    id: 'sale-pop', name: 'Big Sale Pop', cat: 'Social post', sizeId: 'social-post', bg: '#fdf0d5',
    items: [
      { k: 'circle', x: 620, y: -90, w: 560, h: 560, fill: '#ff8a3d', opacity: 0.9 },
      { k: 'rrect', x: 80, y: 120, w: 190, h: 66, rx: 33, fill: '#2b0a03' },
      { k: 'text', x: 80, y: 120, w: 190, size: 22, family: 'Inter', weight: 700, color: '#fdf0d5', text: 'NEW IN', align: 'center', ls: 80 },
      { k: 'text', x: 76, y: 280, w: 920, size: 210, family: 'Anton', color: '#29130a', text: 'MEGA\nSALE', lh: 0.95 },
      { k: 'rrect', x: 84, y: 660, w: 130, h: 12, rx: 6, fill: '#ff8a3d' },
      { k: 'text', x: 80, y: 716, w: 840, size: 44, family: 'Poppins', weight: 600, color: '#4a2c1a', text: 'Up to 50% off — three days only' },
      { k: 'text', x: 80, y: 990, w: 920, size: 26, family: 'Inter', color: '#8a6f5c', ls: 60, text: 'LIBRE · STUDIO · SAMPLE' },
    ],
  },
  {
    id: 'quote-ink', name: 'Quote Card', cat: 'Social post', sizeId: 'social-post', bg: '#f5f1ff',
    items: [
      { k: 'circle', x: -170, y: 640, w: 500, h: 500, fill: '#6434e9', opacity: 0.14 },
      { k: 'text', x: 90, y: 300, w: 900, size: 88, family: 'Playfair Display', color: '#241b4d', align: 'center', lh: 1.2, text: '“Make it simple.\nMake it sing.”' },
      { k: 'rrect', x: 490, y: 660, w: 100, h: 8, rx: 4, fill: '#6434e9' },
      { k: 'text', x: 90, y: 720, w: 900, size: 30, family: 'Space Grotesk', weight: 600, color: '#5b5296', align: 'center', ls: 70, text: 'DAILY NOTES · NO. 24' },
    ],
  },
  {
    id: 'opening', name: 'Grand Opening', cat: 'Story / Reel', sizeId: 'story', bg: '#101828',
    items: [
      { k: 'rect', x: 60, y: 60, w: 960, h: 1800, fill: 'rgba(255,255,255,0)', stroke: 'rgba(255,255,255,0.55)', sw: 3 },
      { k: 'text', x: 120, y: 700, w: 840, size: 230, family: 'Bebas Neue', color: '#ffffff', align: 'center', lh: 0.94, text: 'GRAND\nOPENING' },
      { k: 'rrect', x: 420, y: 1020, w: 240, h: 10, rx: 5, fill: '#f9c74f' },
      { k: 'text', x: 120, y: 1100, w: 840, size: 44, family: 'Space Grotesk', color: '#b9c3d7', align: 'center', text: 'Saturday · 10 AM · Main St' },
      { k: 'text', x: 120, y: 1750, w: 840, size: 26, family: 'Inter', color: '#7787a1', align: 'center', ls: 60, text: 'SWIPE FOR SNEAK PEEKS' },
    ],
  },
  {
    id: 'mocha', name: 'Festival Poster', cat: 'Poster', sizeId: 'poster', bg: '#fae9d0',
    items: [
      { k: 'circle', x: 260, y: 130, w: 560, h: 560, fill: '#c46a33', opacity: 0.25 },
      { k: 'circle', x: 700, y: 90, w: 210, h: 210, fill: '#c46a33', opacity: 0.4 },
      { k: 'text', x: 90, y: 420, w: 900, size: 172, family: 'Oswald', weight: 600, color: '#2d1a0e', lh: 1.0, text: 'MOCHA\nFESTIVAL' },
      { k: 'text', x: 92, y: 800, w: 860, size: 42, family: 'Poppins', color: '#5a3a22', text: 'A day of coffee, cake & calypso.' },
      { k: 'rect', x: 0, y: 1300, w: 1080, h: 228, fill: '#241207' },
      { k: 'text', x: 90, y: 1350, w: 900, size: 40, family: 'Inter', weight: 700, color: '#ffe9d2', text: 'Sept 12–14 · Main Square' },
      { k: 'text', x: 90, y: 1420, w: 900, size: 26, family: 'Inter', color: '#c9a98c', text: 'Free entry · family friendly' },
    ],
  },
  {
    id: 'deck-open', name: 'Deck Opener', cat: 'Presentation', sizeId: 'presentation', bg: '#0d1b3d',
    items: [
      { k: 'circle', x: 1080, y: -220, w: 720, h: 720, fill: '#4cc9f0', opacity: 0.18 },
      { k: 'rrect', x: 120, y: 250, w: 18, h: 380, rx: 9, fill: '#ffb703' },
      { k: 'text', x: 190, y: 300, w: 1240, size: 128, family: 'Inter', weight: 800, color: '#ffffff', text: 'Q3 Product Review' },
      { k: 'text', x: 190, y: 500, w: 1240, size: 40, family: 'Space Grotesk', color: '#9fb3d9', text: 'Sales & growth · October download' },
      { k: 'text', x: 190, y: 790, w: 1200, size: 24, family: 'Inter', color: '#64748b', text: 'Prepared by the Libre team' },
    ],
  },
  {
    id: 'deck-bullets', name: 'Section Slide', cat: 'Presentation', sizeId: 'presentation', bg: '#f8f9ff',
    items: [
      { k: 'rect', x: 0, y: 0, w: 1600, h: 230, fill: '#eef0ff' },
      { k: 'text', x: 120, y: 82, w: 1300, size: 62, family: 'Inter', weight: 800, color: '#241b4d', text: 'What changed this quarter' },
      { k: 'text', x: 130, y: 330, w: 640, size: 34, family: 'Inter', color: '#33384d', lh: 1.5, text: '• Shipping cadence doubled\n• Weekly actives up 18%\n• Two new markets live' },
      { k: 'text', x: 830, y: 330, w: 640, size: 34, family: 'Inter', color: '#33384d', lh: 1.5, text: '• Churn at all-time low\n• Support SLA under 4h\n• NPS 61 → 68' },
      { k: 'text', x: 120, y: 820, w: 1360, size: 22, family: 'Inter', color: '#8b87a3', align: 'center', text: '2 / 12' },
    ],
  },
  {
    id: 'flora', name: 'Flora Invitation', cat: 'Invitation', sizeId: 'invitation', bg: '#fff7f3',
    items: [
      { k: 'circle', x: -180, y: -160, w: 560, h: 560, fill: '#f4a69b', opacity: 0.35 },
      { k: 'circle', x: 900, y: 1160, w: 480, h: 480, fill: '#f4a69b', opacity: 0.25 },
      { k: 'text', x: 190, y: 320, w: 820, size: 60, family: 'Pacifico', color: '#c26d5b', align: 'center', text: 'save the date' },
      { k: 'text', x: 190, y: 470, w: 820, size: 92, family: 'DM Serif Display', color: '#3d2317', align: 'center', lh: 1.15, text: 'You are\nInvited' },
      { k: 'rrect', x: 520, y: 730, w: 160, h: 6, rx: 3, fill: '#d4a373' },
      { k: 'text', x: 190, y: 800, w: 820, size: 34, family: 'Lora', color: '#57423a', align: 'center', lh: 1.6, text: 'Saturday, June 14th · 4 in the afternoon\nThe little garden hall' },
    ],
  },
  {
    id: 'wordmark', name: 'Circle Wordmark', cat: 'Logo', sizeId: 'logo', bg: '#ffffff',
    items: [
      { k: 'circle', x: 140, y: 120, w: 520, h: 520, fill: '#29264d' },
      { k: 'text', x: 140, y: 270, w: 520, size: 220, family: 'Bebas Neue', color: '#ffffff', align: 'center', text: 'LS' },
      { k: 'text', x: 140, y: 690, w: 520, size: 30, family: 'Inter', weight: 600, color: '#6b688f', align: 'center', ls: 140, text: 'STUDIO' },
    ],
  },
  {
    id: 'aurora', name: 'Star Badge', cat: 'Logo', sizeId: 'logo', bg: '#1a1d2e',
    items: [
      { k: 'star5', defFrom: 'star', x: 330, y: 200, w: 140, h: 140, fill: '#ffd166' },
      { k: 'text', x: 120, y: 380, w: 560, size: 128, family: 'Anton', color: '#ffffff', align: 'center', ls: 40, text: 'AURORA' },
      { k: 'text', x: 120, y: 560, w: 560, size: 26, family: 'Space Grotesk', color: '#9aa0b4', align: 'center', ls: 90, text: 'DESIGN COLLECTIVE' },
    ],
  },
  {
    id: 'card-min', name: 'Minimal Card', cat: 'Business card', sizeId: 'business-card', bg: '#ffffff',
    items: [
      { k: 'rect', x: 0, y: 0, w: 340, h: 600, fill: '#233047' },
      { k: 'text', x: 50, y: 220, w: 260, size: 54, family: 'Inter', weight: 800, color: '#ffffff', text: 'Your Name' },
      { k: 'text', x: 50, y: 292, w: 260, size: 24, family: 'Inter', color: '#9db3d4', text: 'Product Designer' },
      { k: 'text', x: 400, y: 230, w: 600, size: 26, family: 'Lora', color: '#43506b', lh: 1.9, text: 'hello@you.example\n555 012 3456\nyour-site.example' },
      { k: 'circle', x: 920, y: 60, w: 70, h: 70, fill: '#f9c74f' },
    ],
  },
  {
    id: 'banner-hot', name: 'Wide Banner', cat: 'Web banner', sizeId: 'banner', bg: '#10162f',
    items: [
      { k: 'circle', x: 1180, y: 60, w: 640, h: 640, fill: '#233063' },
      { k: 'text', x: 90, y: 96, w: 980, size: 120, family: 'Bebas Neue', color: '#ffffff', text: 'LEVEL UP YOUR DOCS' },
      { k: 'rrect', x: 92, y: 250, w: 250, h: 74, rx: 37, fill: '#ff6b6b' },
      { k: 'text', x: 92, y: 250, w: 250, size: 30, family: 'Inter', weight: 700, color: '#ffffff', align: 'center', text: 'Try free' },
    ],
  },
  {
    id: 'resume-clean', name: 'Clean Resume', cat: 'Resume / CV', sizeId: 'resume', bg: '#ffffff',
    items: [
      { k: 'text', x: 90, y: 120, w: 1000, size: 82, family: 'Anton', color: '#16203a', text: 'ALEX MERCER' },
      { k: 'text', x: 92, y: 230, w: 1000, size: 32, family: 'Oswald', color: '#5a6b8c', text: 'SENIOR PRODUCT DESIGNER' },
      { k: 'rrect', x: 92, y: 300, w: 170, h: 9, rx: 4, fill: '#2a5bd7' },
      { k: 'text', x: 92, y: 380, w: 1060, size: 25, family: 'Inter', color: '#57606f', text: 'alex@you.example · 555 010 9999 · Lisbon, PT' },
      { k: 'text', x: 92, y: 470, w: 1060, size: 28, family: 'Inter', weight: 700, color: '#16203a', ls: 40, text: 'EXPERIENCE' },
      { k: 'text', x: 92, y: 530, w: 1060, size: 24, family: 'Inter', color: '#414857', lh: 1.55, text: '2019–now   Lead designer, Fintech Co.\n  • Grew activation 22% with a redesigned onboarding.\n2015–2019   Product designer, Studio Kite' },
      { k: 'text', x: 92, y: 780, w: 1060, size: 28, family: 'Inter', weight: 700, color: '#16203a', ls: 40, text: 'SKILLS' },
      { k: 'text', x: 92, y: 840, w: 1060, size: 24, family: 'Inter', color: '#414857', lh: 1.6, text: 'Design systems · Prototyping · Motion · Research' },
    ],
  },
  {
    id: 'meetup', name: 'Meetup Flyer', cat: 'Flyer', sizeId: 'flyer', bg: '#eafff4',
    items: [
      { k: 'circle', x: 820, y: -120, w: 560, h: 560, fill: '#2f9e44', opacity: 0.16 },
      { k: 'text', x: 100, y: 170, w: 1000, size: 46, family: 'Space Grotesk', weight: 700, color: '#1f7a33', ls: 50, text: 'COMMUNITY NIGHT' },
      { k: 'text', x: 96, y: 260, w: 1040, size: 150, family: 'Archivo Black', color: '#123f22', lh: 1.05, text: 'MAKERS\nMEETUP' },
      { k: 'text', x: 100, y: 590, w: 1000, size: 34, family: 'Inter', color: '#33553f', lh: 1.5, text: 'Demos · pizza · open mic\nFriday, 7 PM — The Foundry' },
      { k: 'rrect', x: 100, y: 1420, w: 1040, h: 120, rx: 20, fill: '#1f7a33' },
      { k: 'text', x: 100, y: 1420, w: 1040, size: 36, family: 'Inter', weight: 700, color: '#eafff4', align: 'center', text: 'RSVP — free entry' },
    ],
  },
  {
    id: 'cover-dark', name: 'Video Cover', cat: 'Video cover', sizeId: 'video-cover', bg: '#0b0b12',
    items: [
      { k: 'rrect', x: 1180, y: 560, w: 240, h: 22, rx: 11, fill: '#ff5d8f' },
      { k: 'text', x: 460, y: 380, w: 1640, size: 300, family: 'Bebas Neue', color: '#ffffff', align: 'center', lh: 0.96, text: 'BUILD IN\nPUBLIC' },
      { k: 'text', x: 460, y: 940, w: 1640, size: 44, family: 'Space Grotesk', color: '#a8a4bb', align: 'center', text: 'Week 24 — shipping the editor, live' },
    ],
  },
  {
    id: 'birthday', name: 'Birthday Greeting', cat: 'Greeting card', sizeId: 'greeting-card', bg: '#ffffff',
    items: [
      { k: 'circle', x: 120, y: 140, w: 46, h: 46, fill: '#ffb703' },
      { k: 'circle', x: 1200, y: 220, w: 56, h: 56, fill: '#ff5d8f' },
      { k: 'circle', x: 300, y: 780, w: 38, h: 38, fill: '#4cc9f0' },
      { k: 'circle', x: 1120, y: 720, w: 48, h: 48, fill: '#80ed99' },
      { k: 'text', x: 150, y: 300, w: 1100, size: 96, family: 'Pacifico', color: '#33384d', align: 'center', lh: 1.25, text: 'Happy Birthday,\ndear friend!' },
      { k: 'text', x: 150, y: 700, w: 1100, size: 30, family: 'Inter', color: '#8b87a3', align: 'center', text: 'From all of us, with love' },
    ],
  },
];

// Size is resolved from sizeId so every consumer can read tpl.size.{w,h}.
export const TEMPLATES = RAW_TEMPLATES.map((t) => ({ ...t, size: sizeById(t.sizeId) }));
export const templateById = (id) => TEMPLATES.find((t) => t.id === id) || null;

// Map a template item to our shared shape geometry (honors star/'defFrom' alias).
export const shapeDefFor = (item) => {
  if (item.def) return item.def;
  const id = item.shapeId || item.defFrom || (item.k === 'star5' ? 'star' : item.k);
  const s = SHAPES.find((x) => x.id === id);
  return s ? s.def : null;
};

const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

// Tiny SVG preview renderer for template cards — draws at natural page scale,
// scaled down via viewBox, so no coordinate math is needed here.
export function templatePreviewSVG(tpl, targetW = 170) {
  const useW = tpl.size.w; const useH = tpl.size.h;
  const s = targetW / useW;
  const H = Math.round(useH * s);
  const parts = [`<rect x="0" y="0" width="${useW}" height="${useH}" fill="${tpl.bg}"/>`];
  for (const it of tpl.items) {
    const o = it.fill || it.color || 'none';
    const op = it.opacity != null ? ` opacity="${it.opacity}"` : '';
    if (it.k === 'circle') {
      const cx = it.x + it.w / 2, cy = it.y + it.h / 2, r = it.w / 2;
      const shape = it.w === it.h ? `<circle cx="${cx}" cy="${cy}" r="${r}"/>` : `<ellipse cx="${cx}" cy="${cy}" rx="${it.w / 2}" ry="${it.h / 2}"/>`;
      parts.push(`<g${op} fill="${o}"${it.stroke ? ` stroke="${it.stroke}" stroke-width="${it.sw || 2}"` : ''}>${shape}</g>`);
    } else if (it.k === 'rect' || it.k === 'rrect') {
      parts.push(`<g${op}><rect x="${it.x}" y="${it.y}" width="${it.w}" height="${it.h}" rx="${it.rx || 0}" fill="${o}"${it.stroke ? ` stroke="${it.stroke}" stroke-width="${it.sw || 2}"` : ''}/></g>`);
    } else if (it.k === 'poly' || it.k === 'star5') {
      const def = shapeDefFor(it);
      if (def && def.kind === 'poly') {
        const pts = def.points
          .map(([px, py]) => `${Math.round((it.x + (px / 100) * it.w) * 10) / 10},${Math.round((it.y + (py / 100) * it.h) * 10) / 10}`)
          .join(' ');
        parts.push(`<g${op} fill="${o}"><polygon points="${pts}"/></g>`);
      }
    } else if (it.k === 'path') {
      parts.push(`<g${op} fill="${o}"><path d="${it.d}" transform="translate(${it.x},${it.y}) scale(${it.w / 100},${it.h / 100})"/></g>`);
    } else if (it.k === 'line') {
      parts.push(`<line x1="${it.x}" y1="${it.y}" x2="${it.x + it.w}" y2="${it.y}" stroke="${it.fill}" stroke-width="${it.h || 4}" stroke-linecap="round"/>`);
    } else if (it.k === 'text') {
      const fam = fontFallback(it.family || 'Inter');
      const weight = it.weight ? ` font-weight="${it.weight}"` : '';
      const ls = it.ls ? ` letter-spacing="${it.ls / 10}"` : '';
      const anchor = it.align === 'center' ? ` text-anchor="middle"` : '';
      const tx = it.align === 'center' ? it.x + it.w / 2 : it.x;
      const lines = String(it.text).split('\n');
      const spans = lines.map((ln, i) =>
        `<tspan x="${tx}" dy="${i === 0 ? 0 : (it.size * (it.lh || 1.15))}">${esc(ln)}</tspan>`).join('');
      parts.push(`<text x="${tx}" y="${it.y + it.size * 0.82}" font-family="${fam}" font-size="${it.size}"${weight}${ls}${anchor} fill="${it.color}">${spans}</text>`);
    }
  }
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${useW} ${useH}" width="${Math.round(useW * s)}" height="${H}" preserveAspectRatio="xMidYMid meet"><g>${parts.join('')}</g></svg>`;
}
