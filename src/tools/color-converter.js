import { $, copy, escapeHtml } from '../lib/ui.js';

// Let the browser parse any CSS color, then read it back as rgb().
function parse(str) {
  const probe = new Option().style;
  probe.color = '';
  probe.color = str.trim();
  if (!probe.color) return null;
  const ctx = document.createElement('canvas').getContext('2d');
  ctx.fillStyle = '#000';
  ctx.fillStyle = probe.color;
  const c = document.createElement('canvas');
  c.width = c.height = 1;
  const x = c.getContext('2d');
  x.fillStyle = ctx.fillStyle;
  x.fillRect(0, 0, 1, 1);
  const [r, g, b, a] = x.getImageData(0, 0, 1, 1).data;
  return { r, g, b, a: a / 255 };
}
const toHex = ({ r, g, b }) => `#${[r, g, b].map((v) => v.toString(16).padStart(2, '0')).join('')}`.toUpperCase();
function toHsl({ r, g, b }) {
  r /= 255; g /= 255; b /= 255;
  const max = Math.max(r, g, b), min = Math.min(r, g, b);
  const l = (max + min) / 2;
  let h = 0, s = 0;
  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    h = max === r ? (g - b) / d + (g < b ? 6 : 0) : max === g ? (b - r) / d + 2 : (r - g) / d + 4;
    h *= 60;
  }
  return [Math.round(h), Math.round(s * 100), Math.round(l * 100)];
}
const lum = ({ r, g, b }) => {
  const f = (v) => { v /= 255; return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4; };
  return 0.2126 * f(r) + 0.7152 * f(g) + 0.0722 * f(b);
};
const ratio = (a, b) => { const [x, y] = [lum(a), lum(b)].sort((m, n) => n - m); return (x + 0.05) / (y + 0.05); };

function render(str) {
  const c = parse(str);
  $('#err').textContent = c ? '' : 'Not a color the browser recognizes.';
  if (!c) return;
  const hex = toHex(c);
  const [h, s, l] = toHsl(c);
  $('#swatch').style.background = hex;
  $('#picker').value = hex.toLowerCase();
  const rows = [['HEX', hex], ['RGB', `rgb(${c.r}, ${c.g}, ${c.b})`], ['HSL', `hsl(${h}, ${s}%, ${l}%)`], ['CSS variable', `--color: ${hex};`]];
  $('#rows').innerHTML = rows.map(([k, v]) => `<tr><th>${k}</th><td class="mono">${escapeHtml(v)}</td><td style="width:1%"><button class="btn-ghost btn-sm" type="button" data-v="${escapeHtml(v)}">Copy</button></td></tr>`).join('');
  const w = ratio(c, { r: 255, g: 255, b: 255 });
  const k = ratio(c, { r: 0, g: 0, b: 0 });
  const grade = (x) => (x >= 7 ? 'AAA' : x >= 4.5 ? 'AA' : x >= 3 ? 'AA large text only' : 'fails');
  $('#contrast').textContent = `Contrast with white text: ${w.toFixed(2)}:1 (${grade(w)}) · with black text: ${k.toFixed(2)}:1 (${grade(k)})`;
}
$('#rows').addEventListener('click', (e) => { const b = e.target.closest('[data-v]'); if (b) copy(b.dataset.v); });
$('#any').addEventListener('input', (e) => render(e.target.value));
$('#picker').addEventListener('input', (e) => { $('#any').value = e.target.value.toUpperCase(); render(e.target.value); });
render($('#any').value);
