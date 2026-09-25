// Main-thread client for ai.worker.js.
import { formatBytes } from './ui.js';

let worker;
let seq = 0;
const pending = new Map();

function getWorker() {
  if (!worker) {
    worker = new Worker(new URL('./ai.worker.js', import.meta.url), { type: 'module' });
    worker.onmessage = ({ data }) => {
      const p = pending.get(data.id);
      if (!p) return;
      if (data.type === 'progress') { p.onProgress?.(data); return; }
      pending.delete(data.id);
      data.type === 'error' ? p.reject(new Error(data.error)) : p.resolve(data.result);
    };
    worker.onerror = (e) => {
      for (const p of pending.values()) p.reject(new Error(e.message || 'The AI worker crashed. Try a smaller file or reload.'));
      pending.clear();
      worker = null;
    };
  }
  return worker;
}

function call(msg, onProgress, transfer = []) {
  const id = ++seq;
  return new Promise((resolve, reject) => {
    pending.set(id, { resolve, reject, onProgress });
    getWorker().postMessage({ id, ...msg }, transfer);
  });
}

let gpuCheck;
export function hasWebGPU() {
  if (!gpuCheck) {
    gpuCheck = (async () => {
      try { return !!(navigator.gpu && (await navigator.gpu.requestAdapter())); }
      catch { return false; }
    })();
  }
  return gpuCheck;
}

/**
 * Create a model handle.
 * spec: { task, model, dtype?: {webgpu, wasm} | string, preferGPU?: boolean }
 */
export function createModel({ task, model, dtype, preferGPU = true }) {
  let resolved;
  const resolveSpec = async () => {
    if (resolved) return resolved;
    const gpu = preferGPU && (await hasWebGPU());
    const device = gpu ? 'webgpu' : 'wasm';
    const d = typeof dtype === 'object' ? dtype[device] : dtype;
    resolved = { task, model, device, dtype: d };
    return resolved;
  };
  return {
    async device() { return (await resolveSpec()).device; },
    /** Loads (downloads + compiles) the model. progress(pct|null, label) */
    async load(progress) {
      const spec = await resolveSpec();
      progress?.(null, `Preparing ${spec.device === 'webgpu' ? 'GPU' : 'CPU'} runtime…`);
      await call({ type: 'load', spec }, (e) => {
        const label = e.total ? `Downloading model · ${formatBytes(e.loaded)} of ${formatBytes(e.total)}` : 'Downloading model…';
        progress?.(e.progress, label);
      });
    },
    async run(input, runOptions, progress) {
      const spec = await resolveSpec();
      const transfer = input instanceof Float32Array ? [input.buffer] : [];
      return call({ type: 'run', spec, input, runOptions }, (e) => progress?.(e.progress, 'Downloading model…'), transfer);
    },
  };
}

/** Plain image result → canvas. Handles 1, 3 and 4 channel data. */
export function imageResultToCanvas({ data, width, height, channels }) {
  const c = document.createElement('canvas');
  c.width = width; c.height = height;
  const ctx = c.getContext('2d');
  const out = ctx.createImageData(width, height);
  for (let i = 0, j = 0; i < width * height; i++, j += channels) {
    const o = i * 4;
    if (channels === 1) { out.data[o] = out.data[o + 1] = out.data[o + 2] = data[j]; out.data[o + 3] = 255; }
    else { out.data[o] = data[j]; out.data[o + 1] = data[j + 1]; out.data[o + 2] = data[j + 2]; out.data[o + 3] = channels === 4 ? data[j + 3] : 255; }
  }
  ctx.putImageData(out, 0, 0);
  return c;
}

/** Decode any audio/video file to mono Float32 PCM at the given sample rate. */
export async function decodeAudio(file, sampleRate = 16000) {
  const buf = await file.arrayBuffer();
  const ctx = new AudioContext({ sampleRate });
  try {
    const audio = await ctx.decodeAudioData(buf);
    if (audio.numberOfChannels === 1) return new Float32Array(audio.getChannelData(0));
    const a = audio.getChannelData(0);
    const b = audio.getChannelData(1);
    const mono = new Float32Array(a.length);
    for (let i = 0; i < a.length; i++) mono[i] = (a[i] + b[i]) / 2;
    return mono;
  } catch {
    throw new Error('Could not read the audio in that file. Try MP3, WAV, M4A or MP4.');
  } finally {
    ctx.close();
  }
}
