import { $, $$, dropzone, progress, copy, toast } from '../lib/ui.js';
import { createModel } from '../lib/ai.js';

// int8 weights on the WASM backend: the most compatible option for Florence-2.
const model = createModel({ task: 'florence', model: 'onnx-community/Florence-2-base-ft', dtype: 'q8', preferGPU: false });
const prog = progress($('#progress'));
const out = $('#out');
let task = '<CAPTION>';
let file = null;
let fileName = 'image.jpg';

$('#detail').addEventListener('click', (e) => {
  const b = e.target.closest('[data-task]');
  if (!b) return;
  $$('#detail button').forEach((x) => x.setAttribute('aria-pressed', String(x === b)));
  task = b.dataset.task;
  if (file) run();
});

async function run() {
  $$('#copy, #copy-html, #rerun').forEach((b) => { b.disabled = true; });
  try {
    await model.load((p, label) => prog.set(p, label));
    prog.busy('Looking at the image…');
    const text = String(await model.run(file, { task })).trim();
    out.textContent = text.charAt(0).toUpperCase() + text.slice(1);
    $$('#copy, #copy-html, #rerun').forEach((b) => { b.disabled = false; });
  } catch (err) {
    console.error(err);
    toast(err.message || 'Could not describe that image.');
  } finally {
    prog.hide();
  }
}

dropzone($('#drop'), {
  accept: 'image/*',
  onFiles: ([f]) => {
    file = f;
    fileName = f.name;
    const img = new Image();
    img.src = URL.createObjectURL(f);
    img.alt = '';
    const pv = $('#preview');
    pv.innerHTML = '';
    pv.append(img);
    pv.hidden = false;
    run();
  },
});

$('#copy').addEventListener('click', () => copy(out.textContent));
$('#copy-html').addEventListener('click', () => {
  const alt = out.textContent.replace(/"/g, '&quot;');
  copy(`<img src="${fileName}" alt="${alt}">`, 'HTML copied');
});
$('#rerun').addEventListener('click', run);
