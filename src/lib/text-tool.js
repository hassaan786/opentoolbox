// Shared controller for input → output Text AI pages (summarizer, grammar, translator, rewriter).
import { $, progress, copy, toast } from './ui.js';
import { modelPicker, getEngine, complete, stop, gpuInfo } from './llm.js';

/**
 * @param {{ system: (opts) => string, user?: (text, opts) => string, options?: () => object, temperature?: number }} cfg
 */
export function textTool(cfg) {
  const getModel = modelPicker($('#model'));
  const prog = progress($('#progress'));
  const input = $('#input');
  const out = $('#out');
  const go = $('#go');
  const stopBtn = $('#stop');

  gpuInfo().then((g) => { if (!g.ok) $('#gpu-warning').hidden = false; });

  const count = () => { $('#count').textContent = `${input.value.trim().split(/\s+/).filter(Boolean).length} words`; };
  input.addEventListener('input', count); count();

  go.addEventListener('click', async () => {
    const text = input.value.trim();
    if (!text) return toast('Paste some text first.');
    go.disabled = true;
    stopBtn.hidden = false;
    out.textContent = '';
    try {
      const eng = await getEngine(getModel(), (p, label) => prog.set(p, label));
      prog.busy('Writing…');
      const opts = cfg.options?.() || {};
      const messages = [
        { role: 'system', content: cfg.system(opts) },
        { role: 'user', content: cfg.user ? cfg.user(text, opts) : text },
      ];
      // textContent only: model output is never rendered as HTML.
      await complete(eng, messages, (t) => { prog.hide(); out.textContent = t; }, { temperature: cfg.temperature, max_tokens: 1500 });
    } catch (err) {
      console.error(err);
      toast(err.message || 'Something went wrong.');
    } finally {
      prog.hide();
      go.disabled = false;
      stopBtn.hidden = true;
    }
  });
  stopBtn.addEventListener('click', stop);
  $('#copy').addEventListener('click', () => out.textContent && copy(out.textContent));
}
