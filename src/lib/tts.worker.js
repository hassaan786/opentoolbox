import { KokoroTTS } from 'kokoro-js';

let tts;

function split(text, max = 280) {
  const sentences = text.replace(/\s+/g, ' ').match(/[^.!?。！？]+[.!?。！？]*\s*/g) || [text];
  const out = [];
  let cur = '';
  for (const s of sentences) {
    if ((cur + s).length > max && cur) { out.push(cur.trim()); cur = ''; }
    if (s.length > max) { for (let i = 0; i < s.length; i += max) out.push(s.slice(i, i + max).trim()); continue; }
    cur += s;
  }
  if (cur.trim()) out.push(cur.trim());
  return out.filter(Boolean);
}

self.onmessage = async ({ data }) => {
  const { id, type } = data;
  try {
    if (!tts) {
      tts = await KokoroTTS.from_pretrained('onnx-community/Kokoro-82M-v1.0-ONNX', {
        dtype: 'q8',
        device: 'wasm',
        progress_callback: (e) => {
          if (e.status === 'progress' && e.file?.endsWith('.onnx')) self.postMessage({ id, type: 'progress', progress: e.progress, loaded: e.loaded, total: e.total });
        },
      });
    }
    if (type === 'load') { self.postMessage({ id, type: 'done' }); return; }

    const parts = split(data.text);
    const pieces = [];
    let sr = 24000;
    for (let i = 0; i < parts.length; i++) {
      const audio = await tts.generate(parts[i], { voice: data.voice, speed: data.speed });
      sr = audio.sampling_rate;
      pieces.push(audio.audio);
      self.postMessage({ id, type: 'progress', progress: ((i + 1) / parts.length) * 100, step: true });
    }
    const gap = new Float32Array(Math.round(sr * 0.12));
    const total = pieces.reduce((n, p) => n + p.length + gap.length, 0);
    const pcm = new Float32Array(total);
    let o = 0;
    for (const p of pieces) { pcm.set(p, o); o += p.length + gap.length; }
    self.postMessage({ id, type: 'done', pcm, sr }, [pcm.buffer]);
  } catch (err) {
    self.postMessage({ id, type: 'error', error: String(err?.message || err) });
  }
};
