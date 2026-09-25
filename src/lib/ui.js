// Shared UI helpers for tool pages.
export const $ = (sel, root = document) => root.querySelector(sel);
export const $$ = (sel, root = document) => [...root.querySelectorAll(sel)];

let toastTimer;
export function toast(msg) {
  const el = $('#toast');
  if (!el) return;
  el.textContent = msg;
  el.classList.add('show');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => el.classList.remove('show'), 1800);
}

export async function copy(text, label = 'Copied') {
  try { await navigator.clipboard.writeText(text); toast(label); }
  catch { toast('Copy failed. Select the text and copy manually.'); }
}

export function download(blobOrUrl, filename) {
  const url = typeof blobOrUrl === 'string' ? blobOrUrl : URL.createObjectURL(blobOrUrl);
  const a = Object.assign(document.createElement('a'), { href: url, download: filename });
  document.body.appendChild(a);
  a.click();
  a.remove();
  if (typeof blobOrUrl !== 'string') setTimeout(() => URL.revokeObjectURL(url), 4000);
}

export const formatBytes = (n) => {
  if (!Number.isFinite(n)) return '–';
  const u = ['B', 'KB', 'MB', 'GB'];
  let i = 0;
  while (n >= 1024 && i < u.length - 1) { n /= 1024; i++; }
  return `${n.toFixed(i ? 1 : 0)} ${u[i]}`;
};

export const baseName = (name) => name.replace(/\.[^.]+$/, '');

/** Wire a .dropzone element. Returns nothing; calls onFiles(File[]). */
export function dropzone(el, { onFiles, accept, multiple = false }) {
  const input = el.querySelector('input[type="file"]');
  if (accept) input.accept = accept;
  input.multiple = multiple;
  const matches = (f) => !accept || accept.split(',').some((a) => {
    a = a.trim();
    if (a.endsWith('/*')) return f.type.startsWith(a.slice(0, -1));
    if (a.startsWith('.')) return f.name.toLowerCase().endsWith(a);
    return f.type === a;
  });
  const handle = (list) => {
    const files = [...list].filter(matches);
    if (!files.length) { toast('That file type is not supported here.'); return; }
    onFiles(multiple ? files : [files[0]]);
  };
  input.addEventListener('change', () => { if (input.files.length) handle(input.files); input.value = ''; });
  ['dragenter', 'dragover'].forEach((e) => el.addEventListener(e, (ev) => { ev.preventDefault(); el.classList.add('drag'); }));
  ['dragleave', 'drop'].forEach((e) => el.addEventListener(e, (ev) => { ev.preventDefault(); el.classList.remove('drag'); }));
  el.addEventListener('drop', (ev) => handle(ev.dataTransfer.files));
  // Paste an image from the clipboard anywhere on the page.
  if (accept && accept.includes('image')) {
    window.addEventListener('paste', (ev) => {
      const files = [...(ev.clipboardData?.files || [])];
      if (files.length) handle(files);
    });
  }
}

/** Progress bar controller bound to a .progress element. */
export function progress(el) {
  const label = el.querySelector('[data-label]');
  const pct = el.querySelector('[data-pct]');
  const bar = el.querySelector('.bar');
  const fill = bar.querySelector('i');
  return {
    show(text) { el.hidden = false; if (text) label.textContent = text; },
    hide() { el.hidden = true; },
    set(p, text) {
      el.hidden = false;
      if (text) label.textContent = text;
      if (p == null) { bar.classList.add('indeterminate'); pct.textContent = ''; return; }
      bar.classList.remove('indeterminate');
      fill.style.width = `${Math.max(0, Math.min(100, p))}%`;
      pct.textContent = `${Math.round(p)}%`;
    },
    busy(text) { this.set(null, text); },
  };
}

export const loadImage = (fileOrUrl) => new Promise((res, rej) => {
  const img = new Image();
  const url = typeof fileOrUrl === 'string' ? fileOrUrl : URL.createObjectURL(fileOrUrl);
  img.onload = () => res(img);
  img.onerror = () => rej(new Error('Could not read that image.'));
  img.src = url;
});

export function imageToCanvas(img, w = img.naturalWidth, h = img.naturalHeight, bg) {
  const c = document.createElement('canvas');
  c.width = w; c.height = h;
  const ctx = c.getContext('2d');
  if (bg) { ctx.fillStyle = bg; ctx.fillRect(0, 0, w, h); }
  ctx.imageSmoothingQuality = 'high';
  ctx.drawImage(img, 0, 0, w, h);
  return c;
}

export const canvasToBlob = (canvas, type = 'image/png', quality) =>
  new Promise((res, rej) => canvas.toBlob((b) => (b ? res(b) : rej(new Error(`This browser cannot export ${type}.`))), type, quality));

/** Before/after slider. `before` and `after` are <img> or <canvas> of equal aspect. */
export function compareSlider(container, before, after) {
  container.innerHTML = '';
  const wrap = document.createElement('div');
  wrap.className = 'slider-compare';
  const top = document.createElement('div');
  top.className = 'top';
  const handle = document.createElement('div');
  handle.className = 'handle';
  handle.setAttribute('role', 'slider');
  handle.setAttribute('aria-label', 'Compare before and after');
  handle.tabIndex = 0;
  wrap.append(after, top, handle);
  top.append(before);
  container.append(wrap);
  let pos = 50;
  const apply = () => {
    const w = wrap.clientWidth;
    before.style.width = `${w}px`;
    before.style.height = `${wrap.clientHeight}px`;
    top.style.width = `${pos}%`;
    handle.style.left = `${pos}%`;
    handle.setAttribute('aria-valuenow', Math.round(pos));
  };
  const move = (clientX) => {
    const r = wrap.getBoundingClientRect();
    pos = Math.max(0, Math.min(100, ((clientX - r.left) / r.width) * 100));
    apply();
  };
  wrap.addEventListener('pointerdown', (e) => { wrap.setPointerCapture(e.pointerId); move(e.clientX); });
  wrap.addEventListener('pointermove', (e) => { if (e.buttons) move(e.clientX); });
  handle.addEventListener('keydown', (e) => {
    if (e.key === 'ArrowLeft') { pos = Math.max(0, pos - 5); apply(); }
    if (e.key === 'ArrowRight') { pos = Math.min(100, pos + 5); apply(); }
  });
  new ResizeObserver(apply).observe(wrap);
  requestAnimationFrame(apply);
}

export const escapeHtml = (s) => String(s)
  .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#39;');

export function onRun(button, fn) {
  button.addEventListener('click', async () => {
    const label = button.textContent;
    button.disabled = true;
    try { await fn(); }
    catch (err) { console.error(err); toast(err.message || 'Something went wrong.'); }
    finally { button.disabled = false; button.textContent = label; }
  });
}
