// Generic Transformers.js worker. One model per (task, model, device, dtype), cached.
import { pipeline, env, RawImage, Florence2ForConditionalGeneration, AutoProcessor } from '@huggingface/transformers';

env.allowLocalModels = false;
env.useBrowserCache = true;

const cache = new Map();

const progressFor = (id) => (e) => {
  if (e.status === 'progress_total') self.postMessage({ id, type: 'progress', progress: e.progress, loaded: e.loaded, total: e.total });
};

// Florence-2 is a generative vision model, not a standard pipeline.
async function florence({ model, device, dtype }, id) {
  const [m, processor] = await Promise.all([
    Florence2ForConditionalGeneration.from_pretrained(model, { device, dtype, progress_callback: progressFor(id) }),
    AutoProcessor.from_pretrained(model),
  ]);
  return async (image, { task = '<MORE_DETAILED_CAPTION>', max_new_tokens = 200 } = {}) => {
    const inputs = await processor(image, task);
    const ids = await m.generate({ ...inputs, max_new_tokens });
    const text = processor.tokenizer.batch_decode(ids, { skip_special_tokens: false })[0];
    return processor.post_process_generation(text, task, image.size)[task];
  };
}

async function load(spec, id) {
  const key = `${spec.task}|${spec.model}|${spec.device}|${JSON.stringify(spec.dtype)}`;
  if (!cache.has(key)) {
    const p = spec.task === 'florence'
      ? florence(spec, id)
      : pipeline(spec.task, spec.model, { device: spec.device, dtype: spec.dtype, progress_callback: progressFor(id) });
    cache.set(key, p);
    p.catch(() => cache.delete(key));
  }
  return cache.get(key);
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
    const run = await load(spec, id);
    if (type === 'load') { self.postMessage({ id, type: 'done', result: null }); return; }
    const arg = input instanceof Blob ? await RawImage.fromBlob(input) : input;
    const result = serialize(await run(arg, runOptions || {}));
    const transfer = result?.__image ? [result.data.buffer] : [];
    self.postMessage({ id, type: 'done', result }, transfer);
  } catch (err) {
    self.postMessage({ id, type: 'error', error: String(err?.message || err) });
  }
};
