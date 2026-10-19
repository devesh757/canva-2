// Page thumbnails rendered offscreen with fabric (used by page strip + previews).
import * as fabric from 'fabric';

export async function pageToDataURL(pageJSON, w, h, { format = 'jpeg', quality = 0.72, multiplier = 0.09, bg = '#ffffff' } = {}) {
  const el = document.createElement('canvas');
  const stage = new fabric.StaticCanvas(el, { width: w, height: h, backgroundColor: bg });
  try {
    if (pageJSON && Array.isArray(pageJSON.objects) && pageJSON.objects.length) {
      await stage.loadFromJSON(pageJSON);
    }
    stage.renderAll();
    return stage.toDataURL({ format, quality, multiplier });
  } finally {
    stage.dispose();
  }
}
