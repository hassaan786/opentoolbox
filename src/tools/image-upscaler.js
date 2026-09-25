import { $, $$, dropzone, progress, download, loadImage, imageToCanvas, canvasToBlob, compareSlider, baseName, toast } from '../lib/ui.js';
import { createModel, imageResultToCanvas } from '../lib/ai.js';

// Swin2SR memory grows fast with input size, so inputs are capped.
const MODELS = {
  2: { model: createModel({ task: 'image-to-image', model: 'Xenova/swin2SR-classical-sr-x2-64', dtype: { webgpu: 'fp32', wasm: 'fp32' } }), max: 640 },
  4: { model: createModel({ task: 'image-to-image', model: 'Xenova/swin2SR-realworld-sr-x4-64-bsrgan-psnr', dtype: { webgpu: 'fp32', wasm: 'fp32' } }), max: 400 },
};
let scale = 2;
const prog = progress($('#progress'));
const drop = $('#drop');
const result = $('#result');
let out = null;
let name = 'image';

const hint = () => { $('#limit-hint').textContent = `Images larger than ${MODELS[scale].max}px on the long side are reduced first.`; };
hint();
$('#scale').addEventListener('click', (e) => {
  const b = e.target.closest('[data-scale]');
  if (!b) return;
  $$('#scale button').forEach((x) => x.setAttribute('aria-pressed', String(x === b)));
  scale = Number(b.dataset.scale);
  hint();
});

async function handle([file]) {
  name = baseName(file.name);
  drop.hidden = true; result.hidden = true;
  try {
    const img = await loadImage(file);
    const { model, max } = MODELS[scale];
    const k = Math.min(1, max / Math.max(img.naturalWidth, img.naturalHeight));
    const w = Math.round(img.naturalWidth * k);
    const h = Math.round(img.naturalHeight * k);
    const input = imageToCanvas(img, w, h, '#ffffff');
    await model.load((p, label) => prog.set(p, label));
    prog.busy(`Upscaling ${w}×${h} → ${w * scale}×${h * scale}. This can take a minute…`);
    const t0 = performance.now();
    out = imageResultToCanvas(await model.run(await canvasToBlob(input, 'image/png'), {}, (p, l) => prog.set(p, l)));
    // Plain browser resize for the "before" side, at the same size.
    const before = imageToCanvas(input, out.width, out.height);
    prog.hide();
    compareSlider($('#stage'), before, out);
    result.hidden = false;
    $('#info').textContent = `${out.width} × ${out.height}px · ${((performance.now() - t0) / 1000).toFixed(1)}s · left: normal resize, right: AI`;
  } catch (err) {
    console.error(err);
    prog.hide(); drop.hidden = false;
    toast(err.message || 'Upscaling failed. Try a smaller image.');
  }
}

dropzone(drop, { accept: 'image/*', onFiles: handle });
$('#dl').addEventListener('click', async () => download(await canvasToBlob(out, 'image/png'), `${name}-${scale}x.png`));
$('#again').addEventListener('click', () => { result.hidden = true; drop.hidden = false; });
