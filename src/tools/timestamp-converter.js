import { $, copy, escapeHtml } from '../lib/ui.js';

const pad = (n) => String(n).padStart(2, '0');
const local = (d) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
const rel = (d) => {
  const s = Math.round((d - Date.now()) / 1000);
  const f = new Intl.RelativeTimeFormat(undefined, { numeric: 'auto' });
  const a = Math.abs(s);
  if (a < 60) return f.format(s, 'second');
  if (a < 3600) return f.format(Math.round(s / 60), 'minute');
  if (a < 86400) return f.format(Math.round(s / 3600), 'hour');
  if (a < 2592000) return f.format(Math.round(s / 86400), 'day');
  if (a < 31536000) return f.format(Math.round(s / 2592000), 'month');
  return f.format(Math.round(s / 31536000), 'year');
};

function render(d) {
  if (Number.isNaN(d.getTime())) return;
  const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;
  const rows = [
    ['Unix (seconds)', String(Math.floor(d.getTime() / 1000))],
    ['Unix (milliseconds)', String(d.getTime())],
    ['ISO 8601 (UTC)', d.toISOString()],
    [`Local (${tz})`, d.toLocaleString(undefined, { dateStyle: 'full', timeStyle: 'long' })],
    ['UTC', d.toUTCString()],
    ['Relative', rel(d)],
  ];
  $('#rows').innerHTML = rows.map(([k, v]) => `<tr><th>${escapeHtml(k)}</th><td class="mono">${escapeHtml(v)}</td><td style="width:1%"><button class="btn-ghost btn-sm" type="button" data-v="${escapeHtml(v)}">Copy</button></td></tr>`).join('');
}
$('#rows').addEventListener('click', (e) => { const b = e.target.closest('[data-v]'); if (b) copy(b.dataset.v); });

$('#epoch').addEventListener('input', (e) => {
  const v = e.target.value.trim();
  if (!/^-?\d+(\.\d+)?$/.test(v)) return;
  const n = Number(v);
  const d = new Date(Math.abs(n) < 1e11 ? n * 1000 : n); // ≤ 11 digits → seconds
  $('#date').value = local(d);
  render(d);
});
$('#date').addEventListener('input', (e) => {
  const d = new Date(e.target.value);
  $('#epoch').value = Math.floor(d.getTime() / 1000);
  render(d);
});

const tick = () => { $('#now').textContent = Math.floor(Date.now() / 1000); };
setInterval(tick, 1000); tick();
const now = new Date();
$('#epoch').value = Math.floor(now.getTime() / 1000);
$('#date').value = local(now);
render(now);
