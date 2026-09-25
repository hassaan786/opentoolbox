// Reorderable file list used by Merge PDF and Image to PDF.
import { escapeHtml, formatBytes } from './ui.js';

export function fileList(el, onChange) {
  let files = [];
  const up = '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="M18 15l-6-6-6 6"/></svg>';
  const down = '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="M6 9l6 6 6-6"/></svg>';
  const x = '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round"><path d="M18 6L6 18M6 6l12 12"/></svg>';
  function render() {
    el.innerHTML = files.map((f, i) => `
      <div class="thumb" data-i="${i}">
        ${f.thumb ? `<img src="${f.thumb}" alt="">` : ''}
        <div class="t-name" title="${escapeHtml(f.file.name)}">${i + 1}. ${escapeHtml(f.file.name)}</div>
        <div>${formatBytes(f.file.size)}${f.pages ? ` · ${f.pages} pages` : ''}</div>
        <div class="t-actions">
          <button class="icon-btn" type="button" data-act="up" aria-label="Move ${escapeHtml(f.file.name)} up" ${i === 0 ? 'disabled' : ''}>${up}</button>
          <button class="icon-btn" type="button" data-act="down" aria-label="Move ${escapeHtml(f.file.name)} down" ${i === files.length - 1 ? 'disabled' : ''}>${down}</button>
          <span class="spacer"></span>
          <button class="icon-btn" type="button" data-act="rm" aria-label="Remove ${escapeHtml(f.file.name)}">${x}</button>
        </div>
      </div>`).join('');
    onChange(files);
  }
  el.addEventListener('click', (e) => {
    const b = e.target.closest('[data-act]');
    if (!b) return;
    const i = Number(b.closest('[data-i]').dataset.i);
    if (b.dataset.act === 'up' && i > 0) [files[i - 1], files[i]] = [files[i], files[i - 1]];
    if (b.dataset.act === 'down' && i < files.length - 1) [files[i + 1], files[i]] = [files[i], files[i + 1]];
    if (b.dataset.act === 'rm') files.splice(i, 1);
    render();
  });
  return {
    add(items) { files.push(...items); render(); },
    get files() { return files; },
    clear() { files = []; render(); },
  };
}
