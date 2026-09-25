import { $, progress, download, toast, formatBytes } from '../lib/ui.js';

const prog = progress($('#progress'));
const worker = new Worker(new URL('../lib/tts.worker.js', import.meta.url), { type: 'module' });
let seq = 0;
const pending = new Map();
worker.onmessage = ({ data }) => {
  const p = pending.get(data.id);
  if (!p) return;
  if (data.type === 'progress') return p.onProgress(data);
  pending.delete(data.id);
  data.type === 'error' ? p.reject(new Error(data.error)) : p.resolve(data);
};
const call = (msg, onProgress) => new Promise((resolve, reject) => {
  const id = ++seq;
  pending.set(id, { resolve, reject, onProgress });
  worker.postMessage({ id, ...msg });
});

function wav(pcm, sr) {
  const buf = new ArrayBuffer(44 + pcm.length * 2);
  const v = new DataView(buf);
  const w = (o, s) => [...s].forEach((c, i) => v.setUint8(o + i, c.charCodeAt(0)));
  w(0, 'RIFF'); v.setUint32(4, 36 + pcm.length * 2, true); w(8, 'WAVE'); w(12, 'fmt ');
  v.setUint32(16, 16, true); v.setUint16(20, 1, true); v.setUint16(22, 1, true);
  v.setUint32(24, sr, true); v.setUint32(28, sr * 2, true); v.setUint16(32, 2, true); v.setUint16(34, 16, true);
  w(36, 'data'); v.setUint32(40, pcm.length * 2, true);
  for (let i = 0; i < pcm.length; i++) v.setInt16(44 + i * 2, Math.max(-1, Math.min(1, pcm[i])) * 0x7fff, true);
  return new Blob([buf], { type: 'audio/wav' });
}

const text = $('#text');
const count = () => { $('#count').textContent = `${text.value.length} / 5000 characters`; };
text.addEventListener('input', count); count();
$('#speed').addEventListener('input', (e) => { $('#speed-val').textContent = `${Number(e.target.value).toFixed(2)}×`; });

let blob = null;
let loaded = false;
$('#go').addEventListener('click', async () => {
  const t = text.value.trim();
  if (!t) return toast('Type some text first.');
  const btn = $('#go');
  btn.disabled = true;
  try {
    if (!loaded) {
      prog.busy('Preparing voice model…');
      await call({ type: 'load' }, (e) => prog.set(e.progress, e.total ? `Downloading voice model · ${formatBytes(e.loaded)} of ${formatBytes(e.total)}` : 'Downloading voice model…'));
      loaded = true;
    }
    prog.set(0, 'Generating speech…');
    const { pcm, sr } = await call({ type: 'speak', text: t, voice: $('#voice').value, speed: Number($('#speed').value) },
      (e) => prog.set(e.progress, 'Generating speech…'));
    blob = wav(pcm, sr);
    const player = $('#player');
    if (player.src) URL.revokeObjectURL(player.src);
    player.src = URL.createObjectURL(blob);
    $('#result').hidden = false;
    player.play().catch(() => {});
  } catch (err) {
    console.error(err);
    toast(err.message || 'Speech generation failed.');
  } finally {
    prog.hide();
    btn.disabled = false;
  }
});
$('#dl').addEventListener('click', () => blob && download(blob, 'speech.wav'));
