import { $, dropzone, progress, canvasToBlob, baseName, toast } from '../lib/ui.js';
import { runBatch, extFor } from '../lib/batch.js';
import { openPdf, renderPage, parseRanges } from '../lib/pdf.js';

const prog = progress($('#progress'));
let current = null;

dropzone($('#drop'), {
  accept: 'application/pdf,.pdf',
  onFiles: async ([file]) => {
    try {
      prog.busy('Opening PDF…');
      const doc = await openPdf(file);
      const pages = $('#pages').value.trim() ? parseRanges($('#pages').value, doc.numPages) : Array.from({ length: doc.numPages }, (_, i) => i + 1);
      const type = $('#format').value;
      const scale = Number($('#dpi').value);
      const name = baseName(file.name);
      prog.hide();
      $('#drop').hidden = true;
      $('#batch').hidden = false;
      $('#summary').textContent = `Rendering ${pages.length} pages…`;
      // runBatch expects File-like items; wrap page numbers.
      const items = pages.map((n) => ({ name: `Page ${n}`, size: file.size / doc.numPages, n }));
      current = await runBatch($('#list'), items, async (it) => {
        const c = await renderPage(doc, it.n, scale);
        if (type !== 'image/png') { // flatten transparency for JPG/WebP
          const ctx = c.getContext('2d');
          ctx.globalCompositeOperation = 'destination-over';
          ctx.fillStyle = '#fff';
          ctx.fillRect(0, 0, c.width, c.height);
        }
        return { blob: await canvasToBlob(c, type, 0.9), name: `${name}-page-${it.n}.${extFor(type)}` };
      }, `${name}-images.zip`);
      $('#summary').textContent = `${current.results.length} pages ready`;
      $('#all').textContent = current.results.length > 1 ? `Download all (${current.results.length}) as ZIP` : 'Download';
      doc.close();
    } catch (e) {
      console.error(e);
      prog.hide();
      toast(e.message || 'Could not render that PDF.');
    }
  },
});
$('#all').addEventListener('click', () => current?.downloadAll());
$('#reset').addEventListener('click', () => { $('#batch').hidden = true; $('#drop').hidden = false; $('#list').innerHTML = ''; });
