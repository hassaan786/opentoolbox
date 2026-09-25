import { $ } from '../lib/ui.js';

const b64url = (s) => {
  s = s.replace(/-/g, '+').replace(/_/g, '/');
  while (s.length % 4) s += '=';
  const bin = atob(s);
  return new TextDecoder().decode(Uint8Array.from(bin, (c) => c.charCodeAt(0)));
};
const when = (sec) => `${new Date(sec * 1000).toLocaleString()} (${sec})`;

function run() {
  const t = $('#input').value.trim().replace(/^Bearer\s+/i, '');
  $('#err').textContent = '';
  $('#status').hidden = true;
  $('#header').textContent = '';
  $('#payload').textContent = '';
  $('#claims').textContent = '';
  if (!t) return;
  const parts = t.split('.');
  if (parts.length < 2) { $('#err').textContent = 'A JWT has three parts separated by dots.'; return; }
  try {
    const header = JSON.parse(b64url(parts[0]));
    const payload = JSON.parse(b64url(parts[1]));
    $('#header').textContent = JSON.stringify(header, null, 2);
    $('#payload').textContent = JSON.stringify(payload, null, 2);
    const lines = [];
    if (payload.iat) lines.push(`Issued: ${when(payload.iat)}`);
    if (payload.nbf) lines.push(`Not before: ${when(payload.nbf)}`);
    if (payload.exp) lines.push(`Expires: ${when(payload.exp)}`);
    $('#claims').textContent = lines.join(' · ');
    const s = $('#status');
    if (header.alg === 'none') {
      s.hidden = false; s.className = 'note warn'; s.textContent = 'alg is "none": this token is unsigned. Servers must reject it.';
    } else if (payload.exp) {
      const expired = payload.exp * 1000 < Date.now();
      s.hidden = false;
      s.className = expired ? 'note warn' : 'note';
      s.textContent = expired ? `Expired ${new Date(payload.exp * 1000).toLocaleString()}` : `Valid until ${new Date(payload.exp * 1000).toLocaleString()} (signature not checked)`;
    }
  } catch { $('#err').textContent = 'Could not decode. Check that you pasted the whole token.'; }
}
$('#input').addEventListener('input', run);
