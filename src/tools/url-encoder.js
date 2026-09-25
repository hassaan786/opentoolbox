import { $, copy, escapeHtml } from '../lib/ui.js';

function parts(text) {
  const box = $('#parts');
  box.innerHTML = '';
  let u;
  try { u = new URL(text.trim()); } catch { return; }
  const rows = [['Protocol', u.protocol], ['Host', u.host], ['Path', decodeURIComponent(u.pathname)], ['Hash', u.hash]]
    .filter(([, v]) => v)
    .concat([...u.searchParams].map(([k, v]) => [`?${k}`, v]));
  box.innerHTML = `<table class="data"><tbody>${rows.map(([k, v]) => `<tr><th>${escapeHtml(k)}</th><td class="mono">${escapeHtml(v)}</td></tr>`).join('')}</tbody></table>`;
}

$('#enc').addEventListener('click', () => {
  $('#err').textContent = '';
  const v = $('#input').value;
  $('#out').textContent = $('#mode').value === 'uri' ? encodeURI(v) : encodeURIComponent(v);
  parts(v);
});
$('#dec').addEventListener('click', () => {
  $('#err').textContent = '';
  const v = $('#input').value.replace(/\+/g, ' ');
  try { $('#out').textContent = $('#mode').value === 'uri' ? decodeURI(v) : decodeURIComponent(v); parts($('#out').textContent); }
  catch { $('#err').textContent = 'Malformed percent-encoding (a % not followed by two hex digits).'; }
});
$('#copy').addEventListener('click', () => $('#out').textContent && copy($('#out').textContent));
