import { $, loadImage, imageToCanvas, canvasToBlob, baseName } from '../lib/ui.js';
import { extFor } from '../lib/batch.js';
import { imageBatchTool } from '../lib/image-batch-tool.js';

$('#quality').addEventListener('input', (e) => { $('#q-val').textContent = e.target.value; });

imageBatchTool(async (file) => {
  const img = await loadImage(file);
  const maxw = Number($('#maxw').value) || Infinity;
  const k = Math.min(1, maxw / img.naturalWidth);
  const w = Math.round(img.naturalWidth * k);
  const h = Math.round(img.naturalHeight * k);
  let type = $('#format').value;
  if (type === 'same') type = ['image/jpeg', 'image/webp'].includes(file.type) ? file.type : 'image/webp';
  const canvas = imageToCanvas(img, w, h, type === 'image/jpeg' ? '#ffffff' : undefined);
  const blob = await canvasToBlob(canvas, type, Number($('#quality').value) / 100);
  // Never hand back a bigger file than the original at the same size.
  if (blob.size >= file.size && k === 1 && type === file.type) return { blob: file, name: file.name };
  return { blob, name: `${baseName(file.name)}-min.${extFor(type)}` };
}, 'compressed-images.zip');
