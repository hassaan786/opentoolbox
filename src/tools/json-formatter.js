import { $, copy, download, formatBytes } from '../lib/ui.js';

const input = $('#input');
const out = $('#out');
const err = $('#err');

const sortKeys = (v) => Array.isArray(v) ? v.map(sortKeys)
  : v && typeof v === 'object' ? Object.fromEntries(Object.keys(v).sort().map((k) => [k, sortKeys(v[k])])) : v;

function parse() {
  err.textContent = '';
  try {
    const v = JSON.parse(input.value);
    return $('#sort').checked ? sortKeys(v) : v;
  } catch (e) {
    // Point at the line/column when the engine gives a position.
    const m = e.message.match(/position (\d+)/);
    if (m) {
      const pos = Number(m[1]);
      const before = input.value.slice(0, pos);
      const line = before.split('\n').length;
      const col = pos - before.lastIndexOf('\n');
      err.textContent = `${e.message} (line ${line}, column ${col})`;
      input.focus();
      input.setSelectionRange(pos, pos + 1);
    } else err.textContent = e.message;
    return undefined;
  }
}
function show(text) {
  out.textContent = text;
  $('#stats').textContent = formatBytes(new Blob([text]).size);
}
const indent = () => ($('#indent').value === 'tab' ? '\t' : Number($('#indent').value));

$('#format').addEventListener('click', () => { const v = parse(); if (v !== undefined) show(JSON.stringify(v, null, indent())); });
$('#minify').addEventListener('click', () => { const v = parse(); if (v !== undefined) show(JSON.stringify(v)); });
input.addEventListener('keydown', (e) => { if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') $('#format').click(); });
$('#copy').addEventListener('click', () => out.textContent && copy(out.textContent));
$('#dl').addEventListener('click', () => out.textContent && download(new Blob([out.textContent], { type: 'application/json' }), 'formatted.json'));
