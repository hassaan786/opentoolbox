import { $, $$, loadImage, imageToCanvas, canvasToBlob, baseName } from '../lib/ui.js';
import { extFor } from '../lib/batch.js';
import { imageBatchTool } from '../lib/image-batch-tool.js';

let mode = 'px';
$('#mode').addEventListener('click', (e) => {
  const b = e.target.closest('[data-mode]');
  if (!b) return;
  mode = b.dataset.mode;
  $$('#mode button').forEach((x) => x.setAttribute('aria-pressed', String(x === b)));
  $$('[data-for]').forEach((f) => { f.hidden = f.dataset.for !== mode; });
});
$('#pct').addEventListener('input', (e) => { $('#pct-val').textContent = `${e.target.value}%`; });

function target(w0, h0) {
  if (mode === 'pct') {
    const k = Number($('#pct').value) / 100;
    return [w0 * k, h0 * k];
  }
  const w = Number($('#w').value) || 0;
  const h = Number($('#h').value) || 0;
  if (!w && !h) return [w0, h0];
  if ($('#keep').checked) {
    const k = Math.min(w ? w / w0 : Infinity, h ? h / h0 : Infinity);
    return [w0 * k, h0 * k];
  }
  return [w || w0, h || h0];
}

imageBatchTool(async (file) => {
  const img = await loadImage(file);
  const [w, h] = target(img.naturalWidth, img.naturalHeight).map((v) => Math.max(1, Math.round(v)));
  const type = ['image/jpeg', 'image/webp', 'image/png'].includes(file.type) ? file.type : 'image/png';
  const blob = await canvasToBlob(imageToCanvas(img, w, h, type === 'image/jpeg' ? '#ffffff' : undefined), type, 0.92);
  return { blob, name: `${baseName(file.name)}-${w}x${h}.${extFor(type)}` };
}, 'resized-images.zip');
