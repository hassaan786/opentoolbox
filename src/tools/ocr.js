import { createWorker } from 'tesseract.js';
import { $, dropzone, progress, copy, download, baseName, toast } from '../lib/ui.js';
import { openPdf, renderPage } from '../lib/pdf.js';

const prog = progress($('#progress'));
const out = $('#out');
let worker = null;
let workerLang = null;
let name = 'text';
let pageLabel = '';

async function getWorker(lang) {
  if (worker && workerLang === lang) return worker;
  if (worker) await worker.terminate();
  prog.busy('Loading OCR engine and language data…');
  worker = await createWorker(lang, 1, {
    logger: (m) => {
      if (m.status === 'recognizing text') prog.set(m.progress * 100, `Reading text${pageLabel}…`);
      else if (m.status?.startsWith('loading')) prog.set(m.progress * 100, 'Loading language data…');
    },
  });
  workerLang = lang;
  return worker;
}

dropzone($('#drop'), {
  accept: 'image/*,application/pdf,.pdf',
  onFiles: async ([file]) => {
    name = baseName(file.name);
    out.textContent = '';
    try {
      const w = await getWorker($('#lang').value);
      const pv = $('#preview');
      pv.innerHTML = '';
      if (file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf')) {
        const doc = await openPdf(file);
        const n = Math.min(doc.numPages, 20);
        const texts = [];
        for (let i = 1; i <= n; i++) {
          pageLabel = ` · page ${i} of ${n}`;
          const c = await renderPage(doc, i, 2);
          if (i === 1) { c.style.maxWidth = '100%'; pv.append(c); pv.hidden = false; }
          const { data } = await w.recognize(c);
          texts.push(n > 1 ? `--- Page ${i} ---\n${data.text.trim()}` : data.text.trim());
          out.textContent = texts.join('\n\n');
        }
        doc.destroy();
      } else {
        pageLabel = '';
        const img = new Image();
        img.src = URL.createObjectURL(file);
        img.alt = '';
        pv.append(img);
        pv.hidden = false;
        const { data } = await w.recognize(file);
        out.textContent = data.text.trim() || '(No text found.)';
      }
    } catch (e) {
      console.error(e);
      toast(e.message || 'OCR failed.');
    } finally {
      prog.hide();
    }
  },
});
$('#copy').addEventListener('click', () => out.textContent && copy(out.textContent));
$('#dl').addEventListener('click', () => out.textContent && download(new Blob([out.textContent], { type: 'text/plain' }), `${name}.txt`));
