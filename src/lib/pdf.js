// Lazy PDF.js loader shared by PDF tools.
let lib;
export async function pdfjs() {
  if (!lib) {
    lib = await import('pdfjs-dist');
    const { default: workerUrl } = await import('pdfjs-dist/build/pdf.worker.min.mjs?url');
    lib.GlobalWorkerOptions.workerSrc = workerUrl;
  }
  return lib;
}

export async function openPdf(file) {
  const { getDocument } = await pdfjs();
  try {
    return await getDocument({ data: new Uint8Array(await file.arrayBuffer()), isEvalSupported: false }).promise;
  } catch (e) {
    if (e?.name === 'PasswordException') throw new Error('This PDF is password-protected.');
    throw new Error('Could not open that PDF.');
  }
}

export async function renderPage(doc, n, scale = 2) {
  const page = await doc.getPage(n);
  const vp = page.getViewport({ scale });
  const c = document.createElement('canvas');
  c.width = Math.floor(vp.width);
  c.height = Math.floor(vp.height);
  await page.render({ canvas: c, canvasContext: c.getContext('2d'), viewport: vp }).promise;
  page.cleanup();
  return c;
}

/** "1-3, 5, 8-" → [1,2,3,5,8..max] (1-based, deduped, in order given). */
export function parseRanges(str, max) {
  const out = [];
  for (const part of str.split(',').map((s) => s.trim()).filter(Boolean)) {
    const m = part.match(/^(\d*)\s*-\s*(\d*)$/);
    if (m) {
      const a = m[1] ? Number(m[1]) : 1;
      const b = m[2] ? Number(m[2]) : max;
      for (let i = Math.max(1, a); i <= Math.min(max, b); i++) out.push(i);
    } else if (/^\d+$/.test(part)) {
      const n = Number(part);
      if (n >= 1 && n <= max) out.push(n);
    } else {
      throw new Error(`“${part}” is not a valid page or range.`);
    }
  }
  return [...new Set(out)];
}
