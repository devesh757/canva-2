// Curated open-licensed (SIL OFL) Google Fonts families, loaded via index.html <link>.
// Each entry maps to a generic fallback family used in mini SVG previews.
export const FONTS = [
  { family: 'Inter',             label: 'Inter',             cat: 'Sans',    fallback: 'sans-serif' },
  { family: 'Poppins',           label: 'Poppins',           cat: 'Sans',    fallback: 'sans-serif' },
  { family: 'Montserrat',        label: 'Montserrat',        cat: 'Sans',    fallback: 'sans-serif' },
  { family: 'Raleway',           label: 'Raleway',           cat: 'Sans',    fallback: 'sans-serif' },
  { family: 'Lato',              label: 'Lato',              cat: 'Sans',    fallback: 'sans-serif' },
  { family: 'Nunito',            label: 'Nunito',            cat: 'Sans',    fallback: 'sans-serif' },
  { family: 'Oswald',            label: 'Oswald',            cat: 'Display', fallback: 'sans-serif' },
  { family: 'Bebas Neue',        label: 'Bebas Neue',        cat: 'Display', fallback: 'sans-serif' },
  { family: 'Anton',             label: 'Anton',             cat: 'Display', fallback: 'sans-serif' },
  { family: 'Archivo Black',     label: 'Archivo Black',     cat: 'Display', fallback: 'sans-serif' },
  { family: 'Space Grotesk',     label: 'Space Grotesk',     cat: 'Sans',    fallback: 'sans-serif' },
  { family: 'Comfortaa',         label: 'Comfortaa',         cat: 'Display', fallback: 'sans-serif' },
  { family: 'Playfair Display',  label: 'Playfair Display',  cat: 'Serif',   fallback: 'serif' },
  { family: 'DM Serif Display',  label: 'DM Serif Display',  cat: 'Serif',   fallback: 'serif' },
  { family: 'Merriweather',      label: 'Merriweather',      cat: 'Serif',   fallback: 'serif' },
  { family: 'Lora',              label: 'Lora',              cat: 'Serif',   fallback: 'serif' },
  { family: 'Pacifico',          label: 'Pacifico',          cat: 'Script',  fallback: 'cursive' },
  { family: 'Dancing Script',    label: 'Dancing Script',    cat: 'Script',  fallback: 'cursive' },
  { family: 'Caveat',            label: 'Caveat',            cat: 'Script',  fallback: 'cursive' },
];
export const fontFallback = (family) => (FONTS.find((f) => f.family === family) || {}).fallback || 'sans-serif';

// Ensures the font's glyphs are available before fabric paints text with it.
export async function ensureFont(family) {
  try {
    await Promise.all([
      document.fonts.load(`700 48px "${family}"`),
      document.fonts.load(`400 48px "${family}"`),
    ]);
    await document.fonts.ready;
  } catch { /* font may already be loaded */ }
}
