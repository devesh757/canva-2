// Export pipeline: rendered offscreen per page via fabric, downloaded as PNG/JPG/PDF/JSON.
import * as fabric from 'fabric';
import { jsPDF } from 'jspdf';
import { toast } from './utils.js';

const safeName = (n = 'design') => String(n).replace(/[^\w\- ]+/g, '').trim().replace(/\s+/g, '-') || 'design';

function download(url, filename) {
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
}

export async function renderPage(pageJSON, w, h, { format = 'png', multiplier = 1 } = {}) {
  const el = document.createElement('canvas');
  const stage = new fabric.StaticCanvas(el, { width: w, height: h, backgroundColor: pageJSON.background || '#ffffff' });
  try {
    if (pageJSON?.objects?.length) await stage.loadFromJSON(pageJSON);
    stage.renderAll();
    return stage.toDataURL({ format, multiplier });
  } finally {
    stage.dispose();
  }
}

export async function downloadPage(pageJSON, name, w, h, format = 'png', multiplier = 1) {
  try {
    const url = await renderPage(pageJSON, w, h, { format, multiplier: multiplier || Math.min(2, 2000 / w) });
    download(url, `${safeName(name)}.${format === 'jpeg' ? 'jpg' : format}`);
    toast(`Downloaded ${format.toUpperCase()}`, 'ok');
  } catch (e) {
    toast(`Export failed: ${e.message}`, 'err');
  }
}

export async function downloadPDF(design, pages) {
  try {
    const { w, h, name } = design;
    const pdf = new jsPDF({ orientation: w >= h ? 'landscape' : 'portrait', unit: 'px', format: [w, h], compress: true });
    for (let i = 0; i < pages.length; i++) {
      const url = await renderPage(pages[i].json, w, h, { format: 'jpeg', multiplier: Math.min(1.5, 1080 / w) });
      if (i > 0) pdf.addPage([w, h], w >= h ? 'landscape' : 'portrait');
      pdf.addImage(url, 'JPEG', 0, 0, w, h);
    }
    pdf.save(`${safeName(name)}.pdf`);
    toast('PDF downloaded', 'ok');
  } catch (e) {
    toast(`PDF export failed: ${e.message}`, 'err');
  }
}

export function downloadJSON(design, pages) {
  const blob = new Blob([JSON.stringify({ ...design, pages }, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  download(url, `${safeName(design.name)}.libre.json`);
  setTimeout(() => URL.revokeObjectURL(url), 4000);
  toast('Design JSON saved', 'ok');
}
