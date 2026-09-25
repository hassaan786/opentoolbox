import { $, $$, dropzone, progress, download, loadImage, canvasToBlob, compareSlider, baseName, toast } from '../lib/ui.js';
import { createModel, imageResultToCanvas, GpuUnsupportedError } from '../lib/ai.js';

const MODELS = {
  // BiRefNet runs out of WASM memory on CPU, so it is GPU-only; other devices use MODNet.
  best: createModel({ task: 'background-removal', model: 'onnx-community/BiRefNet_lite-ONNX', dtype: 'fp16', gpuOnly: true }),
  fast: createModel({ task: 'background-removal', model: 'Xenova/modnet', dtype: { webgpu: 'fp32', wasm: 'q8' } }),
};

const prog = progress($('#progress'));
const drop = $('#drop');
const result = $('#result');
let cutout = null; // canvas with alpha
let fileName = 'image';
let bg = 'transparent';

$('#bg-mode').addEventListener('click', (e) => {
  const b = e.target.closest('[data-bg]');
  if (!b) return;
  $$('#bg-mode button').forEach((x) => x.setAttribute('aria-pressed', String(x === b)));
  bg = b.dataset.bg;
  $('#color-field').hidden = bg !== 'color';
  if (cutout) render();
});
$('#bg-color').addEventListener('input', () => cutout && render());

function composed() {
  const fill = bg === 'color' ? $('#bg-color').value : bg;
  if (fill === 'transparent') return cutout;
  const c = document.createElement('canvas');
  c.width = cutout.width; c.height = cutout.height;
  const ctx = c.getContext('2d');
  ctx.fillStyle = fill;
  ctx.fillRect(0, 0, c.width, c.height);
  ctx.drawImage(cutout, 0, 0);
  return c;
}

let original = null;
function render() {
  const before = original.cloneNode();
  compareSlider($('#stage'), before, composed());
}

async function runWith(model, file) {
  await model.load((p, label) => prog.set(p, label));
  prog.busy(`Removing background on your ${(await model.device()) === 'webgpu' ? 'GPU' : 'CPU'}…`);
  return model.run(file, {}, (p, l) => prog.set(p, l));
}

async function handle([file]) {
  fileName = baseName(file.name);
  drop.hidden = true;
  result.hidden = true;
  try {
    original = await loadImage(file);
    const t0 = performance.now();
    let note = '';
    let out;
    try {
      out = await runWith(MODELS[$('#quality').value], file);
    } catch (err) {
      if (!(err instanceof GpuUnsupportedError) && !/OrtRun|GPU/i.test(err.message)) throw err;
      note = ' · used the fast model (this device cannot run the best one)';
      $('#quality').value = 'fast';
      out = await runWith(MODELS.fast, file);
    }
    cutout = imageResultToCanvas(out);
    prog.hide();
    render();
    result.hidden = false;
    $('#info').textContent = `${cutout.width} × ${cutout.height}px · ${((performance.now() - t0) / 1000).toFixed(1)}s${note}`;
  } catch (err) {
    console.error(err);
    prog.hide();
    drop.hidden = false;
    toast(err.message || 'Could not process that image.');
  }
}

dropzone(drop, { accept: 'image/*', onFiles: handle });
$('#dl').addEventListener('click', async () => {
  const c = composed();
  download(await canvasToBlob(c, 'image/png'), `${fileName}-no-bg.png`);
});
$('#again').addEventListener('click', () => { result.hidden = true; drop.hidden = false; });
