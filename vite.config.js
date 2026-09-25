import { defineConfig } from 'vite';
import { readFileSync, readdirSync } from 'node:fs';
import { resolve } from 'node:path';
import { TOOLS, CATEGORIES, getTool, catName, toolUrl } from './src/lib/registry.js';

const root = import.meta.dirname;
const SITE = 'OpenToolbox';
const partial = (name) => readFileSync(resolve(root, 'src/partials', `${name}.html`), 'utf8');
const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

// Every .html in / and /tools is a page.
const pages = { index: resolve(root, 'index.html') };
for (const f of ['licenses.html', 'privacy.html']) pages[f.replace('.html', '')] = resolve(root, f);
for (const f of readdirSync(resolve(root, 'tools'))) {
  if (f.endsWith('.html')) pages[`tools/${f.replace('.html', '')}`] = resolve(root, 'tools', f);
}

const card = (x) => {
  const badge = x.status === 'soon'
    ? '<span class="badge badge-soon">Soon</span>'
    : x.ai ? '<span class="badge badge-ai">AI</span>' : '';
  const inner = `
    <div class="row"><span class="model">${esc(x.model)}</span>${badge}</div>
    <div class="name">${esc(x.name)}</div>
    <div class="desc">${esc(x.desc)}</div>`;
  return x.status === 'soon'
    ? `<div class="tool-card soon" aria-label="${esc(x.name)} (coming soon)">${inner}</div>`
    : `<a class="tool-card" href="${toolUrl(x.slug)}">${inner}</a>`;
};

const catalog = () => CATEGORIES.map((c) => {
  const list = TOOLS.filter((x) => x.cat === c.id);
  const live = list.filter((x) => x.status === 'live').length;
  return `
  <div class="cat-block" id="${c.id}" data-cat="${c.id}">
    <div class="cat-head">
      <div><h3>${esc(c.name)}</h3><span class="count">${live} tools${list.length > live ? ` · ${list.length - live} coming` : ''}</span></div>
      <button type="button" data-view-cat="${c.id}">View all →</button>
    </div>
    <div class="tool-grid">${list.map(card).join('')}</div>
  </div>`;
}).join('');

const toolHead = (slug) => {
  const x = getTool(slug);
  const title = `${x.name}: free, private, no signup | ${SITE}`;
  const desc = `${x.desc} Runs in your browser${x.ai ? ` with ${x.model}` : ''}. No upload, no account.`;
  return `<title>${esc(title)}</title>
<meta name="description" content="${esc(desc)}">
<meta property="og:title" content="${esc(title)}">
<meta property="og:description" content="${esc(desc)}">
<meta property="og:type" content="website">`;
};

const toolHero = (slug) => {
  const x = getTool(slug);
  return `
<section class="tool-hero">
  <nav class="crumbs" aria-label="Breadcrumb"><a href="/">All tools</a><span aria-hidden="true">/</span><a href="/#${x.cat}">${esc(catName(x.cat))}</a></nav>
  <h1>${esc(x.name)}</h1>
  <p class="lede">${esc(x.desc)}</p>
  <div class="meta-row">
    ${x.ai ? '<span class="meta accent">AI · runs on your device</span>' : '<span class="meta accent">Runs in your browser</span>'}
    <span class="meta">${esc(x.model)}</span>
    <span class="meta">License: ${esc(x.license)}</span>
    <span class="meta">No upload</span>
  </div>
</section>`;
};

const related = (slug) => {
  const x = getTool(slug);
  const list = TOOLS.filter((y) => y.cat === x.cat && y.slug !== slug && y.status === 'live').slice(0, 4);
  if (!list.length) return '';
  return `
<section class="related stack">
  <div class="section-head"><div><span class="eyebrow">More ${esc(catName(x.cat))}</span><h2 style="font-size:32px">Related tools</h2></div></div>
  <div class="tool-grid">${list.map(card).join('')}</div>
</section>`;
};

const privacyNote = (slug) => {
  const x = getTool(slug);
  const lock = '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="5" y="11" width="14" height="10" rx="2"/><path d="M8 11V7a4 4 0 0 1 8 0v4"/></svg>';
  const text = x.ai
    ? `The ${esc(x.model)} model is downloaded once from Hugging Face and cached by your browser. After that, everything runs on your own device. Your files are never uploaded.`
    : 'Everything happens inside this browser tab. Your files are never uploaded anywhere.';
  return `<div class="note">${lock}<p>${text}</p></div>`;
};

const licensesTable = () => TOOLS.filter((x) => x.status === 'live').map((x) =>
  `<tr><td><a href="${toolUrl(x.slug)}">${esc(x.name)}</a></td><td class="mono">${esc(x.model)}</td><td class="mono">${esc(x.license)}</td></tr>`).join('');

const partials = () => ({
  name: 'partials',
  transformIndexHtml: { order: 'pre', handler: (html) => html
      // Short form for tool pages: <!--@toolstart:slug--> …body… <!--@toolend:slug-->
      .replace(/<!--@toolstart:([a-z0-9-]+)-->/, (_, s) =>
        `<!--@header-->\n<main id="main">\n<div class="glow" aria-hidden="true"></div>\n<div class="wrap">\n<!--@toolhero:${s}-->`)
      .replace(/<!--@toolend:([a-z0-9-]+)-->/, (_, s) =>
        `<!--@note:${s}-->\n<!--@related:${s}-->\n</div>\n</main>\n<!--@footer-->\n<script type="module" src="/src/tools/${s}.js"></script>`)
      .replace(/<!--@toolhead:([a-z0-9-]+)-->/, (_, s) => `${toolHead(s)}\n<!--@head-->`)
      .replace('<!--@head-->', partial('head'))
      .replace(/<!--@progress(?::([a-z0-9-]+))?-->/g, (_, id = 'progress') =>
        `<div class="progress" id="${id}" hidden><div class="progress-top"><span data-label>Loading…</span><span data-pct></span></div><div class="bar"><i></i></div></div>`)
      .replace(/<!--@drop:([a-z0-9-]+)\|([^|]*)\|([^>]*)-->/g, (_, id, title, sub) =>
        `<div class="dropzone" id="${id}"><input type="file" aria-label="${esc(title)}"><div class="dz-icon"><svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 16V4M7 9l5-5 5 5"/><path d="M4 16v3a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-3"/></svg></div><div class="dz-title">${esc(title)}</div><div class="dz-sub">${esc(sub)}</div></div>`)
      .replace('<!--@header-->', partial('header'))
      .replace('<!--@footer-->', partial('footer'))
      .replace('<!--@catalog-->', catalog)
      .replace('<!--@licenses-->', licensesTable)
      .replace(/<!--@toolhero:([a-z0-9-]+)-->/, (_, s) => toolHero(s))
      .replace(/<!--@note:([a-z0-9-]+)-->/, (_, s) => privacyNote(s))
      .replace(/<!--@related:([a-z0-9-]+)-->/, (_, s) => related(s)),
  },
});

export default defineConfig({
  plugins: [partials()],
  build: { rollupOptions: { input: pages }, target: 'es2022', chunkSizeWarningLimit: 10000 },
  optimizeDeps: { exclude: ['@huggingface/transformers', '@mlc-ai/web-llm', 'kokoro-js'] },
  worker: { format: 'es' },
});
