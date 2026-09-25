import { PDFDocument } from 'pdf-lib';
import { $, dropzone, progress, download, toast } from '../lib/ui.js';
import { fileList } from '../lib/file-list.js';
import { openPdf, renderPage } from '../lib/pdf.js';

const prog = progress($('#progress'));
const list = fileList($('#list'), (files) => {
  $('#go').disabled = files.length < 2;
  const pages = files.reduce((n, f) => n + (f.pages || 0), 0);
  $('#info').textContent = files.length ? `${files.length} files · ${pages} pages` : '';
});

dropzone($('#drop'), {
  accept: 'application/pdf,.pdf',
  multiple: true,
  onFiles: async (files) => {
    const items = [];
    for (const file of files) {
      try {
        const doc = await openPdf(file);
        const thumb = (await renderPage(doc, 1, 0.4)).toDataURL('image/jpeg', 0.7);
        items.push({ file, pages: doc.numPages, thumb });
        doc.destroy();
      } catch (e) { toast(`${file.name}: ${e.message}`); }
    }
    list.add(items);
  },
});

$('#go').addEventListener('click', async () => {
  $('#go').disabled = true;
  try {
    const out = await PDFDocument.create();
    const files = list.files;
    for (let i = 0; i < files.length; i++) {
      prog.set((i / files.length) * 100, `Adding ${files[i].file.name}…`);
      const src = await PDFDocument.load(await files[i].file.arrayBuffer(), { ignoreEncryption: true });
      const pages = await out.copyPages(src, src.getPageIndices());
      pages.forEach((p) => out.addPage(p));
    }
    prog.set(100, 'Saving…');
    download(new Blob([await out.save()], { type: 'application/pdf' }), 'merged.pdf');
  } catch (e) {
    console.error(e);
    toast('Could not merge. One of the files may be encrypted or damaged.');
  } finally {
    prog.hide();
    $('#go').disabled = list.files.length < 2;
  }
});
$('#clear').addEventListener('click', () => list.clear());
