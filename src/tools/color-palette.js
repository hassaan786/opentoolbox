import { $, dropzone, loadImage, copy } from '../lib/ui.js';

let pixels = null;
let palette = [];
const hex = ([r, g, b]) => `#${[r, g, b].map((v) => Math.round(v).toString(16).padStart(2, '0')).join('')}`.toUpperCase();

function sample(img) {
  const k = Math.min(1, 160 / Math.max(img.naturalWidth, img.naturalHeight));
  const c = document.createElement('canvas');
  c.width = Math.max(1, Math.round(img.naturalWidth * k));
  c.height = Math.max(1, Math.round(img.naturalHeight * k));
  const ctx = c.getContext('2d', { willReadFrequently: true });
  ctx.drawImage(img, 0, 0, c.width, c.height);
  const d = ctx.getImageData(0, 0, c.width, c.height).data;
  const out = [];
  for (let i = 0; i < d.length; i += 4) if (d[i + 3] > 128) out.push([d[i], d[i + 1], d[i + 2]]);
  return out;
}

// k-means++ with a fixed seed so the same image gives the same palette.
function kmeans(pts, k) {
  let seed = 7;
  const rnd = () => ((seed = (seed * 16807) % 2147483647) / 2147483647);
  const dist = (a, b) => (a[0] - b[0]) ** 2 + (a[1] - b[1]) ** 2 + (a[2] - b[2]) ** 2;
  const centers = [pts[Math.floor(rnd() * pts.length)]];
  while (centers.length < k) {
    const d = pts.map((p) => Math.min(...centers.map((c) => dist(p, c))));
    const sum = d.reduce((a, b) => a + b, 0);
    let r = rnd() * sum;
    let i = 0;
    while ((r -= d[i]) > 0 && i < d.length - 1) i++;
    centers.push(pts[i]);
  }
  let counts = [];
  for (let iter = 0; iter < 12; iter++) {
    const acc = centers.map(() => [0, 0, 0]);
    counts = centers.map(() => 0);
    for (const p of pts) {
      let best = 0, bd = Infinity;
      centers.forEach((c, j) => { const dd = dist(p, c); if (dd < bd) { bd = dd; best = j; } });
      acc[best][0] += p[0]; acc[best][1] += p[1]; acc[best][2] += p[2]; counts[best]++;
    }
    centers.forEach((c, j) => { if (counts[j]) centers[j] = acc[j].map((v) => v / counts[j]); });
  }
  return centers.map((c, j) => ({ rgb: c, share: counts[j] / pts.length })).sort((a, b) => b.share - a.share);
}

function render() {
  if (!pixels?.length) return;
  palette = kmeans(pixels, Number($('#count').value));
  const box = $('#swatches');
  box.innerHTML = '';
  for (const p of palette) {
    const h = hex(p.rgb);
    const b = document.createElement('button');
    b.type = 'button';
    b.className = 'swatch';
    b.innerHTML = `<i style="background:${h}"></i><span>${h} · ${Math.round(p.share * 100)}%</span>`;
    b.addEventListener('click', () => copy(h, `${h} copied`));
    box.append(b);
  }
  $('#copy-css').disabled = false;
  $('#copy-json').disabled = false;
}

$('#count').addEventListener('input', (e) => { $('#c-val').textContent = e.target.value; render(); });
dropzone($('#drop'), {
  accept: 'image/*',
  onFiles: async ([f]) => {
    const img = await loadImage(f);
    pixels = sample(img);
    const pv = $('#preview');
    pv.innerHTML = '';
    pv.append(img);
    pv.hidden = false;
    render();
  },
});
$('#copy-css').addEventListener('click', () => copy(`:root {\n${palette.map((p, i) => `  --color-${i + 1}: ${hex(p.rgb)};`).join('\n')}\n}`, 'CSS copied'));
$('#copy-json').addEventListener('click', () => copy(JSON.stringify(palette.map((p) => hex(p.rgb))), 'JSON copied'));
