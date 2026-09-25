// Global: ⌘K palette, repo links, active nav.
import { TOOLS, catName, toolUrl, REPO } from './lib/registry.js';
import { escapeHtml } from './lib/ui.js';

const live = TOOLS.filter((t) => t.status === 'live');

// ---------- repo links ----------
if (REPO) {
  document.querySelectorAll('[data-repo-link]').forEach((a) => {
    a.href = `https://github.com/${REPO}${a.dataset.repoPath || ''}`;
  });
}

// ---------- search ----------
export function searchTools(q) {
  q = q.trim().toLowerCase();
  if (!q) return live;
  const words = q.split(/\s+/);
  return live
    .map((t) => {
      const hay = `${t.name} ${t.desc} ${catName(t.cat)} ${t.model}`.toLowerCase();
      if (!words.every((w) => hay.includes(w))) return null;
      const score = (t.name.toLowerCase().startsWith(q) ? 3 : 0) + (t.name.toLowerCase().includes(q) ? 2 : 0) + (t.ai ? 0.1 : 0);
      return { t, score };
    })
    .filter(Boolean)
    .sort((a, b) => b.score - a.score)
    .map((x) => x.t);
}

export function renderResults(ul, list, active = 0) {
  ul.innerHTML = list.length
    ? list.slice(0, 12).map((t, i) => `
      <li class="p-item" role="option" aria-selected="${i === active}">
        <a href="${toolUrl(t.slug)}"><span class="p-name">${escapeHtml(t.name)}</span><span class="p-cat">${escapeHtml(catName(t.cat))}</span></a>
      </li>`).join('')
    : '<li class="p-empty">No tools match. Try another word.</li>';
}

// ---------- palette ----------
const overlay = document.getElementById('palette');
const input = document.getElementById('palette-input');
const list = document.getElementById('palette-list');
let results = live;
let active = 0;
let lastFocus = null;

function openPalette() {
  lastFocus = document.activeElement;
  overlay.hidden = false;
  input.value = '';
  results = live;
  active = 0;
  renderResults(list, results, active);
  input.focus();
}
function closePalette() {
  overlay.hidden = true;
  lastFocus?.focus?.();
}

document.querySelectorAll('[data-open-palette]').forEach((b) => b.addEventListener('click', openPalette));
overlay.addEventListener('click', (e) => { if (e.target === overlay) closePalette(); });
input.addEventListener('input', () => { results = searchTools(input.value); active = 0; renderResults(list, results, active); });

document.addEventListener('keydown', (e) => {
  if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
    e.preventDefault();
    overlay.hidden ? openPalette() : closePalette();
    return;
  }
  if (overlay.hidden) return;
  const max = Math.min(results.length, 12) - 1;
  if (e.key === 'Escape') closePalette();
  else if (e.key === 'ArrowDown') { e.preventDefault(); active = Math.min(active + 1, max); renderResults(list, results, active); }
  else if (e.key === 'ArrowUp') { e.preventDefault(); active = Math.max(active - 1, 0); renderResults(list, results, active); }
  else if (e.key === 'Enter' && results[active]) { location.href = toolUrl(results[active].slug); }
});

// ---------- active nav ----------
const hash = location.hash.slice(1);
document.querySelectorAll('.main-nav a').forEach((a) => {
  if (hash && a.getAttribute('href') === `/#${hash}`) a.classList.add('active');
});
