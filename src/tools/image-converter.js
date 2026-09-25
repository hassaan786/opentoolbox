import { $, loadImage, imageToCanvas, canvasToBlob, baseName, toast } from '../lib/ui.js';
import { extFor, canEncode } from '../lib/batch.js';
import { imageBatchTool } from '../lib/image-batch-tool.js';

$('#quality').addEventListener('input', (e) => { $('#q-val').textContent = e.target.value; });
canEncode('image/avif').then((ok) => {
  if (!ok) {
    const opt = $('#format option[value="image/avif"]');
    opt.disabled = true;
    opt.textContent = 'AVIF (not supported by this browser)';
  }
});

imageBatchTool(async (file) => {
  const type = $('#format').value;
  if (!(await canEncode(type))) { toast('This browser cannot save that format.'); throw new Error('Format not supported'); }
  const img = await loadImage(file);
  const canvas = imageToCanvas(img, img.naturalWidth || 1024, img.naturalHeight || 1024, type === 'image/jpeg' ? $('#bg').value : undefined);
  const blob = await canvasToBlob(canvas, type, type === 'image/png' ? undefined : Number($('#quality').value) / 100);
  return { blob, name: `${baseName(file.name)}.${extFor(type)}` };
}, 'converted-images.zip');
