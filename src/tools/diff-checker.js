import { $, escapeHtml } from '../lib/ui.js';

// LCS line diff. Guarded against very large inputs (O(n·m) memory).
function diff(a, b, norm) {
  const A = a.split('\n'), B = b.split('\n');
  const na = A.map(norm), nb = B.map(norm);
  const n = A.length, m = B.length;
  if (n * m > 4e6) return null;
  const dp = Array.from({ length: n + 1 }, () => new Uint32Array(m + 1));
  for (let i = n - 1; i >= 0; i--) for (let j = m - 1; j >= 0; j--)
    dp[i][j] = na[i] === nb[j] ? dp[i + 1][j + 1] + 1 : Math.max(dp[i + 1][j], dp[i][j + 1]);
  const out = [];
  let i = 0, j = 0;
  while (i < n && j < m) {
    if (na[i] === nb[j]) { out.push(['same', A[i]]); i++; j++; }
    else if (dp[i + 1][j] >= dp[i][j + 1]) out.push(['del', A[i++]]);
    else out.push(['add', B[j++]]);
  }
  while (i < n) out.push(['del', A[i++]]);
  while (j < m) out.push(['add', B[j++]]);
  return out;
}

function run() {
  const norm = $('#ws').checked ? (s) => s.replace(/\s+/g, ' ').trim() : (s) => s;
  const rows = diff($('#a').value, $('#b').value, norm);
  if (!rows) { $('#out').textContent = 'Texts are too long to compare here (over ~2,000 lines each).'; return; }
  const add = rows.filter((r) => r[0] === 'add').length;
  const del = rows.filter((r) => r[0] === 'del').length;
  $('#stats').textContent = add || del ? `+${add} added · −${del} removed` : 'No differences';
  $('#out').innerHTML = rows.map(([t, v]) => `<div class="diff-line diff-${t}">${t === 'add' ? '+ ' : t === 'del' ? '- ' : '  '}${escapeHtml(v)}</div>`).join('');
}
['#a', '#b'].forEach((s) => $(s).addEventListener('input', run));
$('#ws').addEventListener('change', run);
run();
