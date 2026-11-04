#!/usr/bin/env node
/* Writes what crawlers read straight into the static files, from ecosystem-views.json,
   so the words stay in one place:

     index.html   the library list, the questions and the structured data
     llms.txt     the summary for AI crawlers

   The page still renders the library list itself in the browser, so views can switch.
   Run this after changing ecosystem-views.json:   node scripts/seo-sync.mjs */
import { readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('..', import.meta.url));
const SITE = 'https://footprintjs.github.io/';
const data = JSON.parse(readFileSync(root + 'ecosystem-views.json', 'utf8'));
const product = data.views[data.defaultView];

const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const indent = (block, n) => block.split('\n').map((l) => (l ? ' '.repeat(n) + l : l)).join('\n');
const swap = (html, name, inner) => {
  const a = `<!-- seo:${name}:start -->`, b = `<!-- seo:${name}:end -->`;
  const i = html.indexOf(a), j = html.indexOf(b);
  if (i < 0 || j < 0) throw new Error('marker missing: ' + name);
  return html.slice(0, i + a.length) + '\n' + inner + '\n' + html.slice(j);
};

/* ── the library list, the same markup the page renders ── */
const tile = (n) => {
  const copy = n.views[data.defaultView];
  const links = (n.links || []).map((l, i) =>
    `<a${l.npm ? ' class="lk-npm"' : ''} href="${esc(l.href)}" target="_blank" rel="noreferrer" data-link-index="${i}">${esc(l.productLabel || l.technicalLabel || 'Open')}</a>`).join('');
  return `<article class="lib" id="card-${n.id}" data-node-id="${n.id}" data-group="${n.group}">
  <details class="lib-details">
    <summary class="lib-summary">
      <svg class="lib-icon" viewBox="0 0 24 24" aria-hidden="true"></svg>
      <div class="lib-head">
        <div class="lib-name-row"><h5 class="lib-name">${esc(n.name)}</h5>${n.status ? `<span class="lib-status">${esc(n.status)}</span>` : ''}</div>
        <p class="lib-title">${esc(copy.title)}</p>
      </div>
      <span class="lib-more"></span>
    </summary>
    <div class="lib-body">${n.packageName ? `<code class="lib-package">${esc(n.packageName)}</code>` : ''}<p class="lib-desc">${esc(copy.description)}</p></div>
  </details>${links ? `\n  <nav class="lib-links" aria-label="${esc(n.name)} links">${links}</nav>` : ''}
</article>`;
};
let last = null;
const libraries = data.groupOrder.map((key) => {
  const cat = (data.groupCategory || {})[key] || null;
  let band = '';
  if (cat && cat !== last) {
    const c = product.categories[cat];
    band = `<div class="libs-cat" data-category="${cat}"><h3 class="libs-cat-title">${esc(c.title)}</h3><p class="libs-cat-note">${esc(c.note)}</p></div>\n`;
  }
  last = cat;
  const g = product.groups[key];
  const tiles = data.nodes.filter((n) => n.group === key).map(tile).join('\n');
  return `${band}<section class="libs-group" data-group="${key}" aria-labelledby="group-${key}">
<header class="libs-group-head"><h4 class="libs-group-title" id="group-${key}" data-group-title="${key}">${esc(g.title)}</h4><p class="libs-group-note" data-group-note="${key}">${esc(g.note)}</p></header>
<div class="libs-grid">
${tiles}
</div>
</section>`;
}).join('\n');

/* ── the questions ── */
const faq = data.faq.map((f) => `<details class="faq-item"><summary><h3>${esc(f.q)}</h3></summary><p>${esc(f.a)}</p></details>`).join('\n');

/* ── structured data ── */
const person = { '@id': 'https://sanjay1909.github.io/#person' };
const org = { '@id': SITE + '#org' };
const site = { '@id': SITE + '#website' };
const app = (n) => {
  const urls = (n.links || []).map((l) => l.href);
  const repo = urls.find((u) => u.includes('github.com/footprintjs/') && !u.includes('/blob/') && !u.includes('/tree/'));
  const npm = urls.find((u) => u.includes('npmjs.com/'));
  const home = urls.find((u) => u !== repo && u !== npm && !u.includes('youtu.be') && !u.includes('/blob/') && !u.includes('/blog/')) || repo || npm || SITE;
  const same = [repo, npm].filter((u) => u && u !== home);
  const entry = {
    '@type': 'SoftwareApplication',
    name: n.name,
    applicationCategory: 'DeveloperApplication',
    operatingSystem: 'Cross-platform',
    url: home,
    description: n.views[data.defaultView].description,
    isAccessibleForFree: true,
    offers: { '@type': 'Offer', price: '0', priceCurrency: 'USD' },
    creator: person
  };
  if (same.length) entry.sameAs = same;
  return entry;
};
const title = readFileSync(root + 'index.html', 'utf8').match(/<title>(.*?)<\/title>/)[1];
const description = readFileSync(root + 'index.html', 'utf8').match(/name="description"\s+content="([^"]*)"/)[1];
const graph = {
  '@context': 'https://schema.org',
  '@graph': [
    { '@type': 'WebSite', '@id': site['@id'], url: SITE, name: 'footprintjs', description, inLanguage: 'en', publisher: org },
    { '@type': 'Organization', '@id': org['@id'], name: 'footprintjs', url: SITE, logo: SITE + 'assets/favicon-512x512.png', sameAs: ['https://github.com/footprintjs'], founder: person },
    { '@type': 'Person', '@id': person['@id'], name: 'Sanjay Krishna Anbalagan', alternateName: 'Sanjay', url: 'https://github.com/sanjay1909', sameAs: ['https://github.com/sanjay1909', 'https://www.linkedin.com/in/sanjay-krishna-anbalagan/', 'https://x.com/1909sanjay', 'https://sanjay1909.github.io/'] },
    { '@type': 'WebPage', '@id': SITE + '#page', url: SITE, name: title, description, isPartOf: site, about: org, inLanguage: 'en', primaryImageOfPage: { '@type': 'ImageObject', url: SITE + 'assets/og.png' }, mainEntity: { '@id': SITE + '#questions' } },
    { '@type': 'FAQPage', '@id': SITE + '#questions', mainEntity: data.faq.map((f) => ({ '@type': 'Question', name: f.q, acceptedAnswer: { '@type': 'Answer', text: f.a } })) },
    ...data.nodes.filter((n) => n.links && n.links.length).map(app)
  ]
};
const jsonld = `<script type="application/ld+json">\n${JSON.stringify(graph, null, 2).replace(/</g, '\\u003c')}\n</script>`;

let html = readFileSync(root + 'index.html', 'utf8');
html = swap(html, 'libraries', indent(libraries, 12) + '\n          ');
html = swap(html, 'faq', indent(faq, 12) + '\n          ');
html = swap(html, 'jsonld', indent(jsonld, 4) + '\n    ');
writeFileSync(root + 'index.html', html);

/* ── llms.txt: the same facts, for crawlers that read plain text ── */
const line = (n) => {
  const u = app(n).url;
  return `- [${n.name}](${u})${n.status ? ` (${n.status})` : ''}: ${n.views[data.defaultView].description}`;
};
const section = (titleText, keys) => `## ${titleText}\n\n${data.nodes.filter((n) => keys.includes(n.group) && n.links && n.links.length).map(line).join('\n')}`;
const cats = product.categories;
const llms = `# footprintjs

> ${description}

A record is notes with edges between them, so you can walk back from a result to only the notes behind it. There are two ways to get those edges. Software built in the pattern is stitched by default: it keeps its edges as it runs. Everything you cannot rebuild, such as a React app, a trainer or a device fleet, is stitched in code, and every gap keeps its reason. Either way you get a stitched record you can walk back and replay. A side effect is an audit trail for security monitoring. Default stitching can still have gaps, and record formats and capture limits differ by library. A record is evidence of what was observed. It does not by itself prove correctness, compliance or the cause of an outside event.

${section('Foundations', ['foundations'])}

${section(cats.default.title, ['own'])}

${section(cats.code.title, ['frameworks', 'hybrid', 'collectors'])}

${section('Lenses: read the record', ['lenses'])}

${section('Also in the family', ['more'])}

## Articles

- [Visible Reasoning](${SITE}blog/visible-reasoning/): Why a run should show its own work.
- [The Flowchart Pattern](${SITE}blog/the-flowchart-pattern/): The pattern behind footprintjs.
- [The Trail Pattern](${SITE}blog/the-trail-pattern/): The pattern behind VizFootprint.

## Questions

${data.faq.map((f) => `### ${f.q}\n\n${f.a}`).join('\n\n')}
`;
writeFileSync(root + 'llms.txt', llms);
console.log('synced: index.html, llms.txt');
