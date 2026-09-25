import { PDFDocument } from 'pdf-lib';
import { $, dropzone, progress, download, loadImage, imageToCanvas, canvasToBlob, toast } from '../lib/ui.js';
import { fileList } from '../lib/file-list.js';

const prog = progress($('#progress'));
const SIZES = { a4: [595.28, 841.89], letter: [612, 792] };
const list = fileList($('#list'), (files) => { $('#go').disabled = !files.length; });

dropzone($('#drop'), {
  accept: 'image/*',
  multiple: true,
  onFiles: (files) => list.add(files.map((file) => ({ file, thumb: URL.createObjectURL(file) }))),
});

async function embed(pdf, file) {
  const bytes = new Uint8Array(await file.arrayBuffer());
  if (file.type === 'image/jpeg') return pdf.embedJpg(bytes);
  if (file.type === 'image/png') return pdf.embedPng(bytes);
  // Anything else (WebP, GIF, BMP…) → JPG via canvas.
  const img = await loadImage(file);
  const jpg = await canvasToBlob(imageToCanvas(img, img.naturalWidth, img.naturalHeight, '#ffffff'), 'image/jpeg', 0.92);
  return pdf.embedJpg(new Uint8Array(await jpg.arrayBuffer()));
}

$('#go').addEventListener('click', async () => {
  $('#go').disabled = true;
  try {
    const pdf = await PDFDocument.create();
    const files = list.files;
    const size = $('#size').value;
    const margin = Number($('#margin').value);
    for (let i = 0; i < files.length; i++) {
      prog.set((i / files.length) * 100, `Adding image ${i + 1} of ${files.length}…`);
      const img = await embed(pdf, files[i].file);
      if (size === 'fit') {
        const page = pdf.addPage([img.width, img.height]);
        page.drawImage(img, { x: 0, y: 0, width: img.width, height: img.height });
        continue;
      }
      let [pw, ph] = SIZES[size];
      const orient = $('#orient').value;
      if (orient === 'landscape' || (orient === 'auto' && img.width > img.height)) [pw, ph] = [ph, pw];
      const k = Math.min((pw - margin * 2) / img.width, (ph - margin * 2) / img.height);
      const w = img.width * k;
      const h = img.height * k;
      pdf.addPage([pw, ph]).drawImage(img, { x: (pw - w) / 2, y: (ph - h) / 2, width: w, height: h });
    }
    prog.set(100, 'Saving…');
    download(new Blob([await pdf.save()], { type: 'application/pdf' }), 'images.pdf');
  } catch (e) {
    console.error(e);
    toast('Could not create the PDF.');
  } finally {
    prog.hide();
    $('#go').disabled = !list.files.length;
  }
});
$('#clear').addEventListener('click', () => list.clear());
