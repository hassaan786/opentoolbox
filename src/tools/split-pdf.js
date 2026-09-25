import { PDFDocument } from 'pdf-lib';
import { zipSync } from 'fflate';
import { $, dropzone, download, baseName, toast } from '../lib/ui.js';
import { parseRanges } from '../lib/pdf.js';

let src = null;
let name = 'document';

dropzone($('#drop'), {
  accept: 'application/pdf,.pdf',
  onFiles: async ([file]) => {
    try {
      src = await PDFDocument.load(await file.arrayBuffer(), { ignoreEncryption: true });
      name = baseName(file.name);
      $('#info').textContent = `${file.name} · ${src.getPageCount()} pages`;
      $('#ranges').value = `1-${src.getPageCount()}`;
      $('#drop').hidden = true;
      $('#opts').hidden = false;
    } catch { toast('Could not open that PDF.'); }
  },
});

$('#go').addEventListener('click', async () => {
  $('#err').textContent = '';
  let pages;
  try { pages = parseRanges($('#ranges').value, src.getPageCount()); }
  catch (e) { $('#err').textContent = e.message; return; }
  if (!pages.length) { $('#err').textContent = 'No valid pages selected.'; return; }
  const idx = pages.map((p) => p - 1);
  if ($('#mode').value === 'one') {
    const out = await PDFDocument.create();
    (await out.copyPages(src, idx)).forEach((p) => out.addPage(p));
    download(new Blob([await out.save()], { type: 'application/pdf' }), `${name}-pages.pdf`);
  } else {
    const files = {};
    for (const i of idx) {
      const out = await PDFDocument.create();
      const [p] = await out.copyPages(src, [i]);
      out.addPage(p);
      files[`${name}-page-${i + 1}.pdf`] = [await out.save(), { level: 0 }];
    }
    download(new Blob([zipSync(files)], { type: 'application/zip' }), `${name}-pages.zip`);
  }
});
$('#again').addEventListener('click', () => { $('#opts').hidden = true; $('#drop').hidden = false; });
