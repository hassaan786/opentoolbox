import { $, copy, dropzone } from '../lib/ui.js';

const enc = (s) => {
  const bytes = new TextEncoder().encode(s);
  let bin = '';
  for (let i = 0; i < bytes.length; i += 0x8000) bin += String.fromCharCode(...bytes.subarray(i, i + 0x8000));
  let b = btoa(bin);
  if ($('#urlsafe').checked) b = b.replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
  return b;
};
const dec = (s) => {
  s = s.trim().replace(/^data:[^,]*,/, '').replace(/\s/g, '').replace(/-/g, '+').replace(/_/g, '/');
  while (s.length % 4) s += '=';
  return new TextDecoder('utf-8', { fatal: true }).decode(Uint8Array.from(atob(s), (c) => c.charCodeAt(0)));
};

$('#enc').addEventListener('click', () => { $('#err').textContent = ''; $('#out').textContent = enc($('#input').value); });
$('#dec').addEventListener('click', () => {
  $('#err').textContent = '';
  try { $('#out').textContent = dec($('#input').value); }
  catch { $('#err').textContent = 'Not valid Base64, or it decodes to binary data rather than text.'; }
});
$('#copy').addEventListener('click', () => $('#out').textContent && copy($('#out').textContent));
dropzone($('#drop'), {
  onFiles: ([f]) => {
    if (f.size > 5 * 1024 * 1024) { $('#err').textContent = 'Files over 5 MB make very long strings. Try a smaller file.'; return; }
    const r = new FileReader();
    r.onload = () => { $('#out').textContent = r.result; };
    r.readAsDataURL(f);
  },
});
