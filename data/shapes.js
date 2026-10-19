// Original shape library. All geometry below is generated / authored for this project.
const TAU = Math.PI * 2;

function polyPoints(n, R, r, cx = 50, cy = 50, rot = -Math.PI / 2) {
  const pts = [];
  for (let i = 0; i < n * 2; i++) {
    const rad = i % 2 === 0 ? R : r;
    const a = rot + (i * Math.PI) / n;
    pts.push([cx + rad * Math.cos(a), cy + rad * Math.sin(a)]);
  }
  return pts.map(([x, y]) => [Math.round(x * 10) / 10, Math.round(y * 10) / 10]);
}

export const SHAPES = [
  { id: 'rect',       name: 'Rectangle',     def: { kind: 'rect' } },
  { id: 'rrect',      name: 'Rounded',       def: { kind: 'rrect' } },
  { id: 'circle',     name: 'Circle',        def: { kind: 'circle' } },
  { id: 'triangle',   name: 'Triangle',      def: { kind: 'poly', points: [[50, 3], [97, 95], [3, 95]] } },
  { id: 'star',       name: 'Star',          def: { kind: 'poly', points: polyPoints(5, 48, 19.5) } },
  { id: 'hexagon',    name: 'Hexagon',       def: { kind: 'poly', points: [[93, 50], [71.5, 87.5], [28.5, 87.5], [7, 50], [28.5, 12.5], [71.5, 12.5]] } },
  { id: 'pentagon',   name: 'Pentagon',      def: { kind: 'poly', points: [[50, 3], [95, 36.5], [78, 88], [22, 88], [5, 36.5]] } },
  { id: 'diamond',    name: 'Diamond',       def: { kind: 'poly', points: [[50, 2], [98, 50], [50, 98], [2, 50]] } },
  { id: 'heart',      name: 'Heart',         def: { kind: 'path', d: 'M50 88 C28 70 8 52 8 32 C8 18 18 8 31 8 C39 8 47 12 50 19 C53 12 61 8 69 8 C82 8 92 18 92 32 C92 52 72 70 50 88 Z', vb: 100 } },
  { id: 'bolt',       name: 'Lightning',     def: { kind: 'path', d: 'M62 4 L18 55 L42 55 L36 96 L82 40 L56 40 Z', vb: 100 } },
  { id: 'bubble',     name: 'Speak bubble',  def: { kind: 'path', d: 'M6 10 C6 6 9 3 13 3 L88 3 C92 3 96 6 96 10 L96 58 C96 62 92 65 88 65 L44 65 L22 86 L22 65 L13 65 C9 65 6 62 6 58 Z', vb: 100 } },
  { id: 'line',       name: 'Line',          def: { kind: 'line' } },
];

export const shapeSvg = (def, fill = '#4a4760', stroke = 'none', sw = 0) => {
  const inner =
    def.kind === 'rect' || def.kind === 'rrect' || def.kind === 'circle'
      ? '<rect x="8" y="8" width="84" height="84" rx="12" />' 
      : def.kind === 'circle'
        ? '<circle cx="50" cy="50" r="44" />'
        : def.kind === 'line'
          ? '<line x1="8" y1="50" x2="92" y2="50" stroke-width="10" stroke-linecap="round" />'
          : def.kind === 'poly'
            ? `<polygon points="${def.points.map((p) => `${p[0]},${p[1]}`).join(' ')}" />`
            : `<path d="${def.d}" />`;
  const vs = def.vb ? 0 : 4;
  return `<svg viewBox="${vs} ${vs} ${100 - vs * 2} ${100 - vs * 2}" xmlns="http://www.w3.org/2000/svg"><g fill="${fill}" stroke="${stroke}" stroke-width="${sw}">${inner}</g></svg>`;
};
