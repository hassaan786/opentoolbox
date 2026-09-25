// Shared WebLLM engine for the Text AI tools. Runs Qwen2.5 on WebGPU inside a worker.
import { CreateWebWorkerMLCEngine } from '@mlc-ai/web-llm';

export const MODELS = [
  { key: 'small', label: 'Quick · Qwen2.5 0.5B (~400 MB)', base: 'Qwen2.5-0.5B-Instruct' },
  { key: 'medium', label: 'Balanced · Qwen2.5 1.5B (~1 GB)', base: 'Qwen2.5-1.5B-Instruct' },
  { key: 'large', label: 'Best · Qwen2.5 3B (~2 GB)', base: 'Qwen2.5-3B-Instruct' },
];
const STORE = 'otb.llm.model';

export async function gpuInfo() {
  try {
    if (!navigator.gpu) return { ok: false };
    const adapter = await navigator.gpu.requestAdapter();
    if (!adapter) return { ok: false };
    return { ok: true, f16: adapter.features.has('shader-f16') };
  } catch { return { ok: false }; }
}

export function modelPicker(select) {
  let saved = 'medium';
  try { saved = localStorage.getItem(STORE) || saved; } catch { /* storage blocked */ }
  select.innerHTML = MODELS.map((m) => `<option value="${m.key}"${m.key === saved ? ' selected' : ''}>${m.label}</option>`).join('');
  select.addEventListener('change', () => { try { localStorage.setItem(STORE, select.value); } catch { /* ignore */ } });
  return () => select.value;
}

let engine = null;
let engineId = null;
let loading = null;

export async function getEngine(key, onProgress) {
  const gpu = await gpuInfo();
  if (!gpu.ok) {
    throw new Error('This tool needs WebGPU. Use a recent Chrome, Edge or Arc on desktop (Safari 26+ also works).');
  }
  const m = MODELS.find((x) => x.key === key) || MODELS[1];
  const id = `${m.base}-${gpu.f16 ? 'q4f16_1' : 'q4f32_1'}-MLC`;
  if (engine && engineId === id) return engine;
  if (loading) await loading.catch(() => {});
  if (engine && engineId === id) return engine;
  loading = (async () => {
    const report = (r) => onProgress?.(Math.round((r.progress || 0) * 100), r.text?.includes('Loading model from cache') ? 'Loading model from cache…' : 'Downloading model (first time only)…');
    if (engine) {
      await engine.reload(id);
    } else {
      const worker = new Worker(new URL('./llm.worker.js', import.meta.url), { type: 'module' });
      engine = await CreateWebWorkerMLCEngine(worker, id, { initProgressCallback: report });
    }
    engine.setInitProgressCallback?.(report);
    engineId = id;
    return engine;
  })();
  try { return await loading; } finally { loading = null; }
}

/** Stream a completion. onToken(fullTextSoFar). Returns the final text. */
export async function complete(eng, messages, onToken, opts = {}) {
  let text = '';
  const stream = await eng.chat.completions.create({ messages, stream: true, temperature: opts.temperature ?? 0.4, max_tokens: opts.max_tokens ?? 1024 });
  for await (const chunk of stream) {
    const d = chunk.choices?.[0]?.delta?.content;
    if (d) { text += d; onToken?.(text); }
  }
  return text;
}

export const stop = () => engine?.interruptGenerate?.();
