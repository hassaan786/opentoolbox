// Wires a batch image page: dropzone → runBatch(transform) → results + download all.
import { $, dropzone, formatBytes } from './ui.js';
import { runBatch } from './batch.js';

export function imageBatchTool(transform, zipName) {
  const drop = $('#drop');
  const batch = $('#batch');
  let current = null;
  dropzone(drop, {
    accept: 'image/*',
    multiple: true,
    onFiles: async (files) => {
      files = files.slice(0, 50);
      drop.hidden = true;
      batch.hidden = false;
      $('#summary').textContent = `Processing ${files.length} image${files.length > 1 ? 's' : ''}…`;
      current = await runBatch($('#list'), files, transform, zipName);
      const n = current.results.length;
      $('#summary').textContent = current.saved > 0
        ? `${n} done · saved ${formatBytes(current.saved)} total`
        : `${n} done`;
      $('#all').textContent = n > 1 ? `Download all (${n}) as ZIP` : 'Download';
    },
  });
  $('#all').addEventListener('click', () => current?.downloadAll());
  $('#reset').addEventListener('click', () => { batch.hidden = true; drop.hidden = false; $('#list').innerHTML = ''; });
}
