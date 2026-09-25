import { $, progress, toast } from '../lib/ui.js';
import { modelPicker, getEngine, complete, stop, gpuInfo } from '../lib/llm.js';

const getModel = modelPicker($('#model'));
const prog = progress($('#progress'));
const chat = $('#chat');
const msg = $('#msg');
const SYSTEM = 'You are a helpful, concise assistant running privately in the user\'s browser. Answer clearly. Use plain text and simple "- " lists; do not use Markdown tables.';
let history = [];
let busy = false;

gpuInfo().then((g) => { if (!g.ok) $('#gpu-warning').hidden = false; });

function bubble(role, text = '') {
  $('#empty')?.remove();
  const el = document.createElement('div');
  el.className = `msg ${role}`;
  el.textContent = text; // never innerHTML: model output is untrusted
  chat.append(el);
  chat.scrollTop = chat.scrollHeight;
  return el;
}

msg.addEventListener('input', () => { msg.style.height = 'auto'; msg.style.height = `${Math.min(msg.scrollHeight, 200)}px`; });
msg.addEventListener('keydown', (e) => {
  if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); $('#form').requestSubmit(); }
});

$('#form').addEventListener('submit', async (e) => {
  e.preventDefault();
  const text = msg.value.trim();
  if (!text || busy) return;
  busy = true;
  msg.value = ''; msg.style.height = '';
  $('#send').hidden = true; $('#stop').hidden = false;
  bubble('user', text);
  history.push({ role: 'user', content: text });
  const out = bubble('assistant', '…');
  try {
    const eng = await getEngine(getModel(), (p, label) => prog.set(p, label));
    prog.hide();
    const reply = await complete(eng, [{ role: 'system', content: SYSTEM }, ...history.slice(-12)], (t) => {
      out.textContent = t;
      chat.scrollTop = chat.scrollHeight;
    }, { temperature: 0.6 });
    history.push({ role: 'assistant', content: reply });
  } catch (err) {
    console.error(err);
    out.remove();
    history.pop();
    toast(err.message || 'Something went wrong.');
  } finally {
    prog.hide();
    busy = false;
    $('#send').hidden = false; $('#stop').hidden = true;
    msg.focus();
  }
});

$('#stop').addEventListener('click', stop);
$('#clear').addEventListener('click', () => {
  history = [];
  chat.innerHTML = '<p class="chat-empty" id="empty">New chat started. Ask anything.</p>';
});
