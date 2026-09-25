// Batch file processing UI: runs a transform per file, lists results, downloads one or all (ZIP).
import { zipSync } from 'fflate';
import { $, download, formatBytes, escapeHtml, toast } from './ui.js';

/**
 * @param {HTMLElement} list  container for result cards
 * @param {File[]} files
 * @param {(file: File) => Promise<{blob: Blob, name: string, preview?: string}>} transform
 */
export async function runBatch(list, files, transform, zipName = 'opentoolbox.zip') {
  const results = [];
  list.innerHTML = '';
  let saved = 0;
  for (const file of files) {
    const card = document.createElement('div');
    card.className = 'thumb';
    card.innerHTML = `<div class="bar indeterminate" style="margin:48px 0"><i></i></div><div class="t-name">${escapeHtml(file.name)}</div>`;
    list.append(card);
    try {
      const r = await transform(file);
      results.push(r);
      saved += file.size - r.blob.size;
      const url = URL.createObjectURL(r.blob);
      const pct = Math.round((1 - r.blob.size / file.size) * 100);
      const delta = pct > 0 ? `<span style="color:var(--accent)">−${pct}%</span>` : pct < 0 ? `<span>+${-pct}%</span>` : '';
      card.innerHTML = `
        ${r.blob.type.startsWith('image/') ? `<img src="${url}" alt="">` : ''}
        <div class="t-name" title="${escapeHtml(r.name)}">${escapeHtml(r.name)}</div>
        <div>${formatBytes(file.size)} → ${formatBytes(r.blob.size)} ${delta}</div>
        <div class="t-actions"><a class="btn btn-sm" style="flex:1" href="${url}" download="${escapeHtml(r.name)}">Download</a></div>`;
    } catch (err) {
      console.error(err);
      card.innerHTML = `<div class="t-name">${escapeHtml(file.name)}</div><div class="error">${escapeHtml(err.message || 'Failed')}</div>`;
    }
  }
  return {
    results,
    saved,
    downloadAll() {
      if (!results.length) return;
      if (results.length === 1) return download(results[0].blob, results[0].name);
      Promise.all(results.map(async (r) => [r.name, new Uint8Array(await r.blob.arrayBuffer())]))
        .then((entries) => {
          const seen = new Map();
          const files = {};
          for (const [n, data] of entries) {
            const k = seen.has(n) ? n.replace(/(\.[^.]+)?$/, `-${seen.get(n)}$1`) : n;
            seen.set(n, (seen.get(n) || 1) + 1);
            files[k] = [data, { level: 0 }];
          }
          download(new Blob([zipSync(files)], { type: 'application/zip' }), zipName);
        })
        .catch(() => toast('Could not build the ZIP.'));
    },
  };
}

export const extFor = (mime) => ({ 'image/jpeg': 'jpg', 'image/png': 'png', 'image/webp': 'webp', 'image/avif': 'avif' }[mime] || 'img');

/** Whether the browser can encode this image type via canvas. */
export async function canEncode(mime) {
  const c = document.createElement('canvas');
  c.width = c.height = 2;
  const b = await new Promise((r) => c.toBlob(r, mime));
  return !!b && b.type === mime;
}

export function batchPanel() {
  return { list: $('#list'), bar: $('#batch-bar'), summary: $('#summary'), all: $('#all') };
}
