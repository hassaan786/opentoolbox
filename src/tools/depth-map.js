import { $, $$, dropzone, progress, download, loadImage, canvasToBlob, baseName, toast } from '../lib/ui.js';
import { createModel, imageResultToCanvas } from '../lib/ai.js';

const model = createModel({ task: 'depth-estimation', model: 'onnx-community/depth-anything-v2-small', dtype: { webgpu: 'fp16', wasm: 'q8' } });
const prog = progress($('#progress'));
const drop = $('#drop');
const result = $('#result');
const stage = $('#stage');
let depth = null; // grayscale canvas at original size
let photo = null;
let name = 'image';
let view = 'depth';

// Turbo-like ramp: dark blue (far) → green → yellow → red (near).
const RAMP = [[48, 18, 59], [65, 69, 171], [57, 162, 252], [27, 229, 181], [116, 254, 93], [201, 239, 52], [251, 185, 56], [245, 105, 24], [201, 41, 3], [122, 4, 3]];
function ramp(v) {
  const x = (v / 255) * (RAMP.length - 1);
  const i = Math.min(RAMP.length - 2, Math.floor(x));
  const f = x - i;
  return RAMP[i].map((c, k) => Math.round(c + (RAMP[i + 1][k] - c) * f));
}

function styled() {
  const inv = $('#invert').checked;
  const c = document.createElement('canvas');
  c.width = depth.width; c.height = depth.height;
  const ctx = c.getContext('2d');
  const src = depth.getContext('2d').getImageData(0, 0, c.width, c.height);
  const d = src.data;
  for (let i = 0; i < d.length; i += 4) {
    const v = inv ? 255 - d[i] : d[i];
    if (view === 'color') { const [r, g, b] = ramp(v); d[i] = r; d[i + 1] = g; d[i + 2] = b; }
    else { d[i] = d[i + 1] = d[i + 2] = v; }
  }
  ctx.putImageData(src, 0, 0);
  return c;
}

function render() {
  stage.innerHTML = '';
  if (view === '3d') {
    const img = photo.cloneNode();
    img.style.transition = 'transform .1s';
    img.style.maxHeight = '70vh';
    stage.append(img);
    stage.onpointermove = (e) => {
      const r = stage.getBoundingClientRect();
      const x = (e.clientX - r.left) / r.width - 0.5;
      const y = (e.clientY - r.top) / r.height - 0.5;
      img.style.transform = `rotateY(${x * 14}deg) rotateX(${-y * 14}deg) scale(1.02)`;
    };
    stage.onpointerleave = () => { img.style.transform = ''; };
    return;
  }
  stage.onpointermove = null;
  stage.append(styled());
}

$('#view').addEventListener('click', (e) => {
  const b = e.target.closest('[data-view]');
  if (!b) return;
  $$('#view button').forEach((x) => x.setAttribute('aria-pressed', String(x === b)));
  view = b.dataset.view;
  render();
});
$('#invert').addEventListener('change', render);

async function handle([file]) {
  name = baseName(file.name);
  drop.hidden = true; result.hidden = true;
  try {
    photo = await loadImage(file);
    await model.load((p, label) => prog.set(p, label));
    prog.busy('Estimating depth…');
    const t0 = performance.now();
    const raw = imageResultToCanvas(await model.run(file, {}, (p, l) => prog.set(p, l)));
    // Scale the depth map back to the photo's size.
    depth = document.createElement('canvas');
    depth.width = photo.naturalWidth; depth.height = photo.naturalHeight;
    depth.getContext('2d').drawImage(raw, 0, 0, depth.width, depth.height);
    prog.hide();
    render();
    result.hidden = false;
    $('#info').textContent = `${depth.width} × ${depth.height}px · ${((performance.now() - t0) / 1000).toFixed(1)}s · brighter = closer`;
  } catch (err) {
    console.error(err);
    prog.hide(); drop.hidden = false;
    toast(err.message || 'Could not process that image.');
  }
}

dropzone(drop, { accept: 'image/*', onFiles: handle });
$('#dl').addEventListener('click', async () => {
  const v = view; if (view === '3d') view = 'depth';
  const c = styled(); view = v;
  download(await canvasToBlob(c, 'image/png'), `${name}-depth.png`);
});
$('#again').addEventListener('click', () => { result.hidden = true; drop.hidden = false; });
