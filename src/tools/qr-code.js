import QRCode from 'qrcode';
import { $, $$, download } from '../lib/ui.js';

let type = 'url';
const esc = (s) => s.replace(/([\\;,:"])/g, '\\$1');

function payload() {
  switch (type) {
    case 'text': return $('#text').value;
    case 'wifi': return `WIFI:T:${$('#enc').value};S:${esc($('#ssid').value)};${$('#enc').value === 'nopass' ? '' : `P:${esc($('#wpass').value)};`};`;
    case 'email': return `mailto:${$('#to').value.trim()}${$('#subj').value ? `?subject=${encodeURIComponent($('#subj').value)}` : ''}`;
    default: return $('#url').value.trim();
  }
}
const opts = (width) => ({ width, margin: 2, errorCorrectionLevel: $('#ecc').value, color: { dark: $('#fg').value, light: $('#bg').value } });

async function render() {
  const text = payload();
  $('#err').textContent = '';
  if (!text) return;
  try { await QRCode.toCanvas($('#qr'), text, opts(320)); }
  catch (e) { $('#err').textContent = e.message; }
}

$('#type').addEventListener('click', (e) => {
  const b = e.target.closest('[data-type]');
  if (!b) return;
  type = b.dataset.type;
  $$('#type button').forEach((x) => x.setAttribute('aria-pressed', String(x === b)));
  $$('[data-panel]').forEach((p) => { p.hidden = p.dataset.panel !== type; });
  render();
});
document.querySelectorAll('input, textarea, select').forEach((el) => el.addEventListener('input', render));
$('#png').addEventListener('click', async () => download(await QRCode.toDataURL(payload(), opts(1024)), 'qr-code.png'));
$('#svg').addEventListener('click', async () => download(new Blob([await QRCode.toString(payload(), { ...opts(1024), type: 'svg' })], { type: 'image/svg+xml' }), 'qr-code.svg'));
render();
