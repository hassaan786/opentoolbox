import { zipSync } from 'fflate';
import { $, $$, dropzone, loadImage, canvasToBlob, download, copy } from '../lib/ui.js';

const SIZES = [
  { name: 'favicon-16x16.png', size: 16 },
  { name: 'favicon-32x32.png', size: 32 },
  { name: 'apple-touch-icon.png', size: 180 },
  { name: 'android-chrome-192x192.png', size: 192 },
  { name: 'android-chrome-512x512.png', size: 512 },
];
const SNIPPET = `<link rel="icon" type="image/x-icon" href="/favicon.ico">
<link rel="icon" type="image/png" sizes="32x32" href="/favicon-32x32.png">
<link rel="icon" type="image/png" sizes="16x16" href="/favicon-16x16.png">
<link rel="apple-touch-icon" sizes="180x180" href="/apple-touch-icon.png">
<link rel="manifest" href="/site.webmanifest">`;
const MANIFEST = JSON.stringify({
  name: '', short_name: '',
  icons: [
    { src: '/android-chrome-192x192.png', sizes: '192x192', type: 'image/png' },
    { src: '/android-chrome-512x512.png', sizes: '512x512', type: 'image/png' },
  ],
  theme_color: '#ffffff', background_color: '#ffffff', display: 'standalone',
}, null, 2);

let source = null; // canvas 512×512
let mode = 'image';

function fromImage(img) {
  const c = document.createElement('canvas');
  c.width = c.height = 512;
  const ctx = c.getContext('2d');
  const s = Math.min(img.naturalWidth || 512, img.naturalHeight || 512);
  const sx = ((img.naturalWidth || 512) - s) / 2;
  const sy = ((img.naturalHeight || 512) - s) / 2;
  ctx.imageSmoothingQuality = 'high';
  ctx.drawImage(img, sx, sy, s, s, 0, 0, 512, 512);
  return c;
}

function fromText() {
  const c = document.createElement('canvas');
  c.width = c.height = 512;
  const ctx = c.getContext('2d');
  const r = (Number($('#radius').value) / 100) * 512;
  ctx.fillStyle = $('#bgc').value;
  ctx.beginPath();
  ctx.roundRect(0, 0, 512, 512, r);
  ctx.fill();
  const t = $('#txt').value || ' ';
  ctx.fillStyle = $('#fg').value;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.font = `700 ${t.length > 1 ? 250 : 330}px ${$('#font').value}`;
  ctx.fillText(t, 256, 272);
  return c;
}

function scaled(size) {
  // Step down in halves for sharper small icons.
  let cur = source;
  while (cur.width / 2 >= size) {
    const n = document.createElement('canvas');
    n.width = n.height = cur.width / 2;
    const ctx = n.getContext('2d');
    ctx.imageSmoothingQuality = 'high';
    ctx.drawImage(cur, 0, 0, n.width, n.height);
    cur = n;
  }
  const c = document.createElement('canvas');
  c.width = c.height = size;
  const ctx = c.getContext('2d');
  ctx.imageSmoothingQuality = 'high';
  ctx.drawImage(cur, 0, 0, size, size);
  return c;
}

// ICO container with embedded PNGs (supported by every current browser).
async function ico(sizes) {
  const pngs = await Promise.all(sizes.map(async (s) => new Uint8Array(await (await canvasToBlob(scaled(s))).arrayBuffer())));
  const header = 6 + 16 * pngs.length;
  const total = header + pngs.reduce((n, p) => n + p.length, 0);
  const buf = new Uint8Array(total);
  const v = new DataView(buf.buffer);
  v.setUint16(2, 1, true); v.setUint16(4, pngs.length, true);
  let off = header;
  pngs.forEach((p, i) => {
    const e = 6 + i * 16;
    v.setUint8(e, sizes[i] >= 256 ? 0 : sizes[i]); v.setUint8(e + 1, sizes[i] >= 256 ? 0 : sizes[i]);
    v.setUint16(e + 4, 1, true); v.setUint16(e + 6, 32, true);
    v.setUint32(e + 8, p.length, true); v.setUint32(e + 12, off, true);
    buf.set(p, off); off += p.length;
  });
  return buf;
}

function render() {
  const box = $('#previews');
  box.innerHTML = '';
  for (const s of [16, 32, 64, 128]) {
    const c = scaled(s);
    c.style.width = `${Math.max(s, 32)}px`;
    c.style.imageRendering = s < 32 ? 'pixelated' : 'auto';
    c.style.borderRadius = '6px';
    c.title = `${s}×${s}`;
    box.append(c);
  }
  $('#snippet').textContent = SNIPPET;
  $('#zip').disabled = false;
  $('#copy').disabled = false;
}

$('#src-mode').addEventListener('click', (e) => {
  const b = e.target.closest('[data-src]');
  if (!b) return;
  mode = b.dataset.src;
  $$('#src-mode button').forEach((x) => x.setAttribute('aria-pressed', String(x === b)));
  $$('[data-src-panel]').forEach((p) => { p.hidden = p.dataset.srcPanel !== mode; });
  if (mode === 'text') { source = fromText(); render(); }
});
['#txt', '#font', '#fg', '#bgc', '#radius'].forEach((s) => $(s).addEventListener('input', () => {
  $('#r-val').textContent = `${$('#radius').value}%`;
  if (mode === 'text') { source = fromText(); render(); }
}));

dropzone($('#drop'), { accept: 'image/*', onFiles: async ([f]) => { source = fromImage(await loadImage(f)); render(); } });

$('#zip').addEventListener('click', async () => {
  const files = { 'favicon.ico': await ico([16, 32, 48]), 'site.webmanifest': new TextEncoder().encode(MANIFEST), 'snippet.html': new TextEncoder().encode(SNIPPET) };
  for (const { name, size } of SIZES) files[name] = new Uint8Array(await (await canvasToBlob(scaled(size))).arrayBuffer());
  download(new Blob([zipSync(files)], { type: 'application/zip' }), 'favicons.zip');
});
$('#copy').addEventListener('click', () => copy(SNIPPET));
