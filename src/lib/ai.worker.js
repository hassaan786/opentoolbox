// Generic Transformers.js worker. One pipeline per (task, model, device, dtype), cached.
import { pipeline, env, RawImage } from '@huggingface/transformers';

env.allowLocalModels = false;
env.useBrowserCache = true;

const pipes = new Map();

async function getPipe({ task, model, device, dtype }, id) {
  const key = `${task}|${model}|${device}|${dtype}`;
  if (!pipes.has(key)) {
    const p = pipeline(task, model, {
      device,
      dtype,
      progress_callback: (e) => {
        if (e.status === 'progress_total') self.postMessage({ id, type: 'progress', progress: e.progress, loaded: e.loaded, total: e.total });
      },
    });
    pipes.set(key, p);
    p.catch(() => pipes.delete(key));
  }
  return pipes.get(key);
}

const toPlainImage = (img) => ({ __image: true, data: img.data, width: img.width, height: img.height, channels: img.channels });

function serialize(out) {
  if (out instanceof RawImage) return toPlainImage(out);
  if (Array.isArray(out) && out[0] instanceof RawImage) return toPlainImage(out[0]);
  if (out && out.depth instanceof RawImage) return toPlainImage(out.depth);
  if (Array.isArray(out) && out[0]?.depth instanceof RawImage) return toPlainImage(out[0].depth);
  return out;
}

self.onmessage = async ({ data }) => {
  const { id, type, spec, input, runOptions } = data;
  try {
    const pipe = await getPipe(spec, id);
    if (type === 'load') { self.postMessage({ id, type: 'done', result: null }); return; }
    let arg = input;
    if (input instanceof Blob) arg = await RawImage.fromBlob(input);
    const out = await pipe(arg, runOptions || {});
    const result = serialize(out);
    const transfer = result?.__image ? [result.data.buffer] : [];
    self.postMessage({ id, type: 'done', result }, transfer);
  } catch (err) {
    self.postMessage({ id, type: 'error', error: String(err?.message || err) });
  }
};
