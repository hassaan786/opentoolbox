import { $, copy, escapeHtml } from '../lib/ui.js';

const words = (s) => s
  .replace(/([a-z0-9])([A-Z])/g, '$1 $2')
  .replace(/([A-Z]+)([A-Z][a-z])/g, '$1 $2')
  .split(/[^\p{L}\p{N}]+/u)
  .filter(Boolean)
  .map((w) => w.toLowerCase());
const cap = (w) => w.charAt(0).toUpperCase() + w.slice(1);

const CASES = [
  ['camelCase', (w) => w.map((x, i) => (i ? cap(x) : x)).join('')],
  ['PascalCase', (w) => w.map(cap).join('')],
  ['snake_case', (w) => w.join('_')],
  ['kebab-case', (w) => w.join('-')],
  ['CONSTANT_CASE', (w) => w.join('_').toUpperCase()],
  ['dot.case', (w) => w.join('.')],
  ['Title Case', (w) => w.map(cap).join(' ')],
  ['Sentence case', (w) => cap(w.join(' '))],
  ['lowercase', (w, raw) => raw.toLowerCase()],
  ['UPPERCASE', (w, raw) => raw.toUpperCase()],
];

function render() {
  const raw = $('#input').value;
  const w = words(raw);
  $('#rows').innerHTML = CASES.map(([name, fn]) => {
    const v = w.length ? fn(w, raw) : '';
    return `<tr><th>${name}</th><td class="mono">${escapeHtml(v)}</td><td style="width:1%"><button class="btn-ghost btn-sm" type="button" data-v="${escapeHtml(v)}">Copy</button></td></tr>`;
  }).join('');
}
$('#rows').addEventListener('click', (e) => { const b = e.target.closest('[data-v]'); if (b) copy(b.dataset.v); });
$('#input').addEventListener('input', render);
render();
