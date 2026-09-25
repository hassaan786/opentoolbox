import { $, escapeHtml } from '../lib/ui.js';

function run() {
  $('#err').textContent = '';
  const src = $('#pattern').value;
  const text = $('#text').value;
  if (!src) { $('#out').textContent = ''; $('#highlight').textContent = text; return; }
  let re;
  try {
    let flags = $('#flags').value.replace(/[^dgimsuyv]/g, '');
    if (!flags.includes('g')) flags += 'g';
    re = new RegExp(src, flags);
  } catch (e) { $('#err').textContent = e.message; return; }

  const matches = [];
  const start = performance.now();
  for (const m of text.matchAll(re)) {
    matches.push(m);
    if (m[0] === '' && matches.length > 5000) break;
    if (performance.now() - start > 500) { $('#err').textContent = 'Stopped after 0.5s. This pattern may backtrack heavily.'; break; }
  }
  $('#count').textContent = `Matches (${matches.length})`;

  // Highlighted text: escape every slice, wrap matches in <mark>.
  let html = '';
  let last = 0;
  for (const m of matches) {
    if (!m[0]) continue;
    html += escapeHtml(text.slice(last, m.index)) + `<mark style="background:var(--accent);color:var(--accent-ink);border-radius:3px">${escapeHtml(m[0])}</mark>`;
    last = m.index + m[0].length;
  }
  $('#highlight').innerHTML = html + escapeHtml(text.slice(last));

  $('#out').textContent = matches.length
    ? matches.slice(0, 200).map((m, i) => {
      const groups = m.slice(1).map((g, j) => `  $${j + 1}: ${JSON.stringify(g)}`);
      const named = m.groups ? Object.entries(m.groups).map(([k, v]) => `  ${k}: ${JSON.stringify(v)}`) : [];
      return [`#${i + 1} ${JSON.stringify(m[0])} at ${m.index}`, ...groups, ...named].join('\n');
    }).join('\n')
    : 'No matches.';
}
['#pattern', '#flags', '#text'].forEach((s) => $(s).addEventListener('input', run));
run();
