import { $, copy, dropzone, escapeHtml, formatBytes } from '../lib/ui.js';

const ALGOS = ['SHA-1', 'SHA-256', 'SHA-384', 'SHA-512'];
const hex = (buf) => [...new Uint8Array(buf)].map((b) => b.toString(16).padStart(2, '0')).join('');

async function show(data, label) {
  const rows = await Promise.all(ALGOS.map(async (a) => [a, hex(await crypto.subtle.digest(a, data))]));
  $('#hashes').innerHTML = (label ? `<p class="hint">${escapeHtml(label)}</p>` : '') + rows.map(([a, h]) => `
    <div class="field"><span class="label">${a}</span>
      <div class="row-wrap" style="flex-wrap:nowrap"><pre class="output" style="flex:1;margin:0;min-height:0">${h}</pre><button class="btn-ghost btn-sm" type="button" data-h="${h}">Copy</button></div>
    </div>`).join('') + '<p class="hint">SHA-1 is only for checksums. Do not use any of these on their own to store passwords; use bcrypt or Argon2 on the server.</p>';
}
$('#hashes').addEventListener('click', (e) => { const b = e.target.closest('[data-h]'); if (b) copy(b.dataset.h); });
$('#text').addEventListener('input', (e) => show(new TextEncoder().encode(e.target.value)));
dropzone($('#drop'), { onFiles: async ([f]) => show(await f.arrayBuffer(), `${f.name} · ${formatBytes(f.size)}`) });

function uuids() { $('#uuids').textContent = Array.from({ length: Number($('#n').value) }, () => crypto.randomUUID()).join('\n'); }
$('#uuid').addEventListener('click', uuids);
$('#n').addEventListener('change', uuids);
$('#copy-uuid').addEventListener('click', () => copy($('#uuids').textContent));
uuids();
show(new TextEncoder().encode(''));
