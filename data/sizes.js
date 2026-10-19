// Canvas preset sizes — Libre Studio originals.
export const SIZES = [
  { id: 'social-post',    name: 'Social post',    w: 1080, h: 1080, hint: 'Instagram / LinkedIn • square',      emoji: '📱' },
  { id: 'story',          name: 'Story / Reel',   w: 1080, h: 1920, hint: 'Vertical 9:16',                      emoji: '🎬' },
  { id: 'poster',         name: 'Poster',         w: 1080, h: 1528, hint: 'Print / Pinterest',                  emoji: '🖼️' },
  { id: 'presentation',   name: 'Presentation',   w: 1600, h: 900,  hint: 'Slides 16:9',                        emoji: '🖥️' },
  { id: 'invitation',     name: 'Invitation',     w: 1200, h: 1500, hint: 'Cards & events',                     emoji: '💌' },
  { id: 'logo',           name: 'Logo',           w: 800,  h: 800,  hint: 'Brand mark, square',                 emoji: '✨' },
  { id: 'business-card',  name: 'Business card',  w: 1050, h: 600,  hint: '3.5 × 2 in',                         emoji: '🪪' },
  { id: 'banner',         name: 'Web banner',     w: 1584, h: 396,  hint: 'Wide header strip',                  emoji: '📰' },
  { id: 'resume',         name: 'Resume / CV',    w: 1240, h: 1754, hint: 'A4 at 150 dpi',                      emoji: '📄' },
  { id: 'flyer',          name: 'Flyer',          w: 1240, h: 1748, hint: 'A4 portrait',                        emoji: '📣' },
  { id: 'video-cover',    name: 'Video cover',    w: 2560, h: 1440, hint: 'YouTube 16:9',                       emoji: '🎥' },
  { id: 'greeting-card',  name: 'Greeting card',  w: 1400, h: 1000, hint: 'Folds & thanks-yous',                emoji: '🎉' },
];
export const sizeById = (id) => SIZES.find((s) => s.id === id) || SIZES[0];
