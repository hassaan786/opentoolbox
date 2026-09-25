import { CATEGORIES, toolUrl } from './lib/registry.js';
import { $, $$ } from './lib/ui.js';
import { searchTools, renderResults } from './main.js';

// ---------- waveform ----------
const heights = [18,30,44,26,58,70,40,22,34,62,78,52,30,18,26,48,66,74,50,36,24,40,60,72,56,34,20,28,46,64,80,58,38,26,18,32,54,68,44,28,22,36,52,70,62,40,26,18,30,48];
$('#wave').innerHTML = heights.map((h, i) => `<span class="${i < 30 ? 'on' : ''}" style="height:${h}px"></span>`).join('');

// ---------- category tabs ----------
const PREVIEW = 4;
const tabs = $('#tabs');
const blocks = $$('.cat-block');
const tabDefs = [{ id: 'all', name: 'All' }, ...CATEGORIES];
tabs.innerHTML = tabDefs.map((c) =>
  `<button type="button" class="tab" role="tab" data-tab="${c.id}" aria-selected="false">${c.name}</button>`).join('');

function select(id, scroll = false) {
  $$('.tab', tabs).forEach((b) => b.setAttribute('aria-selected', String(b.dataset.tab === id)));
  blocks.forEach((b) => {
    const show = id === 'all' || b.dataset.cat === id;
    b.hidden = !show;
    const cards = $$('.tool-card', b);
    cards.forEach((c, i) => { c.hidden = id === 'all' && i >= PREVIEW; });
    const more = $('[data-view-cat]', b);
    more.hidden = id !== 'all' || cards.length <= PREVIEW;
  });
  if (scroll) $('#all-tools').scrollIntoView({ behavior: 'smooth', block: 'start' });
}

tabs.addEventListener('click', (e) => {
  const b = e.target.closest('[data-tab]');
  if (!b) return;
  select(b.dataset.tab);
  history.replaceState(null, '', b.dataset.tab === 'all' ? location.pathname : `#${b.dataset.tab}`);
});
tabs.addEventListener('keydown', (e) => {
  if (!['ArrowLeft', 'ArrowRight'].includes(e.key)) return;
  const all = $$('.tab', tabs);
  const i = all.indexOf(document.activeElement);
  const next = all[(i + (e.key === 'ArrowRight' ? 1 : -1) + all.length) % all.length];
  next.focus(); next.click();
});
document.addEventListener('click', (e) => {
  const b = e.target.closest('[data-view-cat]');
  if (!b) return;
  e.preventDefault();
  select(b.dataset.viewCat, true);
  history.replaceState(null, '', `#${b.dataset.viewCat}`);
});

const fromHash = () => {
  const h = location.hash.slice(1);
  if (CATEGORIES.some((c) => c.id === h)) select(h, true);
  else select('all');
};
window.addEventListener('hashchange', fromHash);
fromHash();

// ---------- hero search ----------
const form = $('#hero-search');
const q = $('#hero-q');
const ul = $('#hero-results');
let results = [];
let active = 0;
q.addEventListener('input', () => {
  if (!q.value.trim()) { ul.innerHTML = ''; return; }
  results = searchTools(q.value);
  active = 0;
  renderResults(ul, results, active);
});
q.addEventListener('keydown', (e) => {
  if (!results.length || !ul.innerHTML) return;
  const max = Math.min(results.length, 12) - 1;
  if (e.key === 'ArrowDown') { e.preventDefault(); active = Math.min(active + 1, max); renderResults(ul, results, active); }
  if (e.key === 'ArrowUp') { e.preventDefault(); active = Math.max(active - 1, 0); renderResults(ul, results, active); }
  if (e.key === 'Escape') ul.innerHTML = '';
});
form.addEventListener('submit', (e) => {
  e.preventDefault();
  const list = searchTools(q.value);
  if (list[active] || list[0]) location.href = toolUrl((list[active] || list[0]).slug);
});
document.addEventListener('click', (e) => { if (!form.contains(e.target)) ul.innerHTML = ''; });
