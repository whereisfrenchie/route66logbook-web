/**
 * Build the Route 66 guides: /guides/ and one page per article.
 *
 * Called by build.js — run `node build.js`, not this file.
 *
 * Reads  _guides/NN-slug.md          one article each (front matter + body)
 *        _guides/sources.md          the list at the bottom of /guides/
 *        guide.template.html        the /guides/ page
 *        guide-article.template.html
 * Writes guide/index.html and guide/<slug>/index.html
 *
 * The folder is _guide, not guide, because GitHub Pages runs Jekyll, and
 * Jekyll publishes nothing whose name starts with an underscore. The raw
 * .md files never become pages of their own.
 *
 * ADDING AN ARTICLE
 * Copy any _guides/*.md, change the front matter and the text, run
 * `node build.js`. It appears on /guides/ in its group, gets its own page and
 * joins the sitemap. Its photo goes in images/guides/<slug>.jpg (16:10, about
 * 1600 × 1000); until that file exists the slot shows the name it expects.
 *
 * THE BODY FORMAT is a small, strict subset of Markdown — enough for these
 * articles and nothing that can be half-understood:
 *   ## Heading          section heading
 *   ### Heading         sub-heading
 *   - item              bullet list
 *   {{cta}}             the "Explore Route 66 Logbook" button
 *   ![description](/images/file.jpg "Caption")
 *                       a photo inside the article, on a line of its own.
 *                       The file must exist; the caption is optional and
 *                       may contain a [link](url). Upright photos are shown
 *                       narrower than landscape ones. Add {screen} after the
 *                       closing ) for an app screenshot: phone-width, with a
 *                       shadow.
 *   > text              a pull quote
 *   [[state Illinois | /images/guides/badges/illinois.png]]
 *                       a state section heading with its badge; it gets an
 *                       id (#illinois) and an "All states" link back up
 *   [[states]]          the "Jump to a state" menu, built from every
 *                       [[state]] line in the article
 *   [[download Button label | /downloads/file.pdf | /images/preview.jpg | description]]
 *                       a downloadable file: its preview image with a small
 *                       shadow and a teal button. Both files must exist; the
 *                       button shows the file's size.
 *   >> figure | text    a fact call-out: a big figure ("2,400 miles") and a
 *                       line explaining it
 *   ::# Label | value   a detour card, one line per field; consecutive ::
 *   :: Label | value    lines make one card. ::# fields are the big figures
 *                       across the top ("Drive | 20 min · 12 miles each way":
 *                       the part before · is large, the rest a note under
 *                       it); :: fields are the label/value rows below
 *   ::! Card title      optional, replaces "Detour at a glance"
 *   ::@ History, Nature optional category pills, coloured like the app's
 *                       map pins. Only the app's own categories are accepted
 *                       (CATEGORIES below, copied from src/lib/theme.ts).
 *                       On its own, outside a card, it is just the pills —
 *                       put it straight under a stop's ### heading
 *   ::* Why it matters  optional: marks the card "Carole's pick" (coral
 *                       badge and border) with this line in her voice
 *   **bold** *italic* [text](url)   inside any paragraph, heading or item
 * Anything else is a paragraph. Raw HTML is escaped, never passed through.
 *
 * FRONT MATTER
 *   title, slug, group (plan | places | road), order, standfirst, description
 *   updated    optional, shown in the byline ("September 2026")
 *   published  optional ISO date (2026-09-26); becomes datePublished
 *   accent     optional words of the title to show in coral in the page's
 *              heading only ("How to Plan and Navigate"); they must appear
 *              in the title exactly
 *   photoalt   optional description of the photo for screen readers and
 *              search; without it the photo is described by the title
 */
'use strict';
const fs   = require('fs');
const path = require('path');

const GROUPS = {
  plan:   { name: 'Plan your trip', title: 'Plan your <em>trip.</em>' },
  places: { name: 'Where to stop',  title: 'Where to <em>stop.</em>' },
  road:   { name: 'Road culture',   title: 'Road <em>culture.</em>' },
};
// The three guides tiled at the end of /history/ and /prepare/. Prepare gets
// the planning guides that have the fewest links from other articles.
const KEEP_READING = {
  'history/index.html': ['route-66-history', 'route-66-centennial-2026', 'route-66-ghost-towns'],
  'prepare/index.html': ['how-many-days-route-66', 'route-66-on-a-budget', 'route-66-packing-list'],
};
const REQUIRED = ['title', 'slug', 'group', 'order', 'standfirst', 'description'];
const WORDS_PER_MINUTE = 230;

const DOWNLOAD = `  <!-- DOWNLOAD BAND (matches the home page) -->
  <section class="download" id="download">
    <div class="download-inner">
      <h2 class="download-title reveal">Ready to<br>hit the <em>road?</em></h2>
      <p class="download-sub reveal">The map is free to explore. One-time unlock to plan and log your trip. No subscription.</p>
      <div class="download-badges reveal">
        <a href="https://apps.apple.com/app/route-66-logbook/id6774524322" class="badge-btn" target="_blank" rel="noopener">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="white"><path d="APPLE_PATH"/></svg>
          <div>
            <span class="badge-btn-label">Download on the</span>
            <span class="badge-btn-store">App Store</span>
          </div>
        </a>
        <a href="https://play.google.com/store/apps/details?id=com.route66logbook.app" class="badge-btn badge-btn-android" target="_blank" rel="noopener">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="white"><path d="ANDROID_PATH"/></svg>
          <div>
            <span class="badge-btn-label">Get it on</span>
            <span class="badge-btn-store">Google Play</span>
          </div>
        </a>
      </div>
    </div>
  </section>`;

const esc = (s) => String(s)
  .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

function inline(s) {
  return esc(s)
    .replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
    .replace(/\*([^*]+)\*/g, '<em>$1</em>')
    .replace(/\[([^\]]+)\]\(([^)\s]+)\)/g, (m, text, href) => {
      const external = /^https?:/.test(href) && !href.startsWith('https://route66logbook.com');
      return `<a href="${href}"${external ? ' target="_blank" rel="noopener"' : ''}>${text}</a>`;
    });
}

/** Width and height of a JPEG, read from its header — enough to reserve the
 *  photo's space before it loads, and to tell upright from landscape. */
function jpegSize(file) {
  const b = fs.readFileSync(file);
  if (b[0] !== 0xff || b[1] !== 0xd8) return null;
  for (let i = 2; i < b.length - 9;) {
    if (b[i] !== 0xff) { i++; continue; }
    const marker = b[i + 1];
    if (marker >= 0xc0 && marker <= 0xcf && ![0xc4, 0xc8, 0xcc].includes(marker)) {
      return { h: b.readUInt16BE(i + 5), w: b.readUInt16BE(i + 7) };
    }
    i += 2 + b.readUInt16BE(i + 2);
  }
  return null;
}

/** Width and height of a PNG, from its IHDR chunk. */
function pngSize(file) {
  const b = fs.readFileSync(file);
  if (b.toString('ascii', 1, 4) !== 'PNG') return null;
  return { w: b.readUInt32BE(16), h: b.readUInt32BE(20) };
}
const slugify = (t) => t.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '')
  .replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
// The app's stop categories, in its own order (src/lib/theme.ts, CAT_COLORS in
// the app repo). Their colours are in styles/guide.css as .cat-<slug>.
const CATEGORIES = [
  'Kitsch', 'Food', 'History', 'Neon', 'Nature', 'Motel',
  'Gas Station', 'Ghost Town/Ruins', 'Mural', 'Original Route', 'Shop', 'Off-route',
];
const STATE_LINE =/^\[\[state (.+?) \| (\/images\/[^\s|]+\.png)\]\]$/;

const IMAGE_LINE = /^!\[([^\]]*)\]\((\/images\/[^)\s]+\.jpe?g)(?:\s+"([^"]*)")?\)(?:\s+\{(screen)\})?$/i;

/** The body format described at the top. Returns [html, wordCount]. */
function renderBody(src, label, die, root) {
  const out = [];
  let list = null;
  let words = 0;
  const closeList = () => { if (list) { out.push('      <ul>\n' + list.join('\n') + '\n      </ul>'); list = null; } };
  let card = null;
  const closeCard = () => {
    if (!card) return;
    const stats = card.filter((f) => f.kind === '#');
    const rows = card.filter((f) => f.kind === '');
    const title = card.find((f) => f.kind === '!');
    const cats = card.find((f) => f.kind === '@');
    const pick = card.find((f) => f.kind === '*');
    // A ::@ line on its own is just the pills, under a stop's heading.
    if (cats && card.length === 1) {
      out.push(`      <ul class="detour-cats cat-row" aria-label="Categories in the app">\n` +
        cats.value.map((c) => `        <li class="cat cat-${slugify(c)}">${esc(c)}</li>`).join('\n') +
        `\n      </ul>`);
      card = null;
      return;
    }
    out.push(`      <aside class="detour${pick ? ' pick' : ''} reveal">\n` +
      (pick ? `        <p class="pick-badge"><span aria-hidden="true">★</span> Carole's pick</p>\n` : '') +
      `        <div class="detour-head">\n` +
      `          <p class="detour-label">${inline(title ? title.value : 'Detour at a glance')}</p>\n` +
      (cats ? `          <ul class="detour-cats" aria-label="Categories in the app">\n` +
        cats.value.map((c) => `            <li class="cat cat-${slugify(c)}">${esc(c)}</li>`).join('\n') +
        `\n          </ul>\n` : '') +
      `        </div>\n` +
      (pick ? `        <p class="pick-note">${inline(pick.value)}</p>\n` : '') +
      (stats.length ? `        <div class="detour-stats">\n` + stats.map((f) => {
        const [big, ...note] = f.value.split(' · ');
        return `          <div class="detour-stat">\n` +
          `            <p class="detour-stat-label">${inline(f.label)}</p>\n` +
          `            <p class="detour-stat-value">${inline(big)}</p>\n` +
          (note.length ? `            <p class="detour-stat-note">${inline(note.join(' · '))}</p>\n` : '') +
          `          </div>`;
      }).join('\n') + `\n        </div>\n` : '') +
      (rows.length ? `        <dl class="detour-rows">\n` + rows.map((f) =>
        `          <div><dt>${inline(f.label)}</dt><dd>${inline(f.value)}</dd></div>`).join('\n') + `\n        </dl>\n` : '') +
      `      </aside>`);
    card = null;
  };

  // States are collected first so that [[states]] can list them wherever it sits.
  const states = [];
  for (const raw of src.split('\n')) {
    const line = raw.trim();
    if (!line.startsWith('[[state ')) continue;
    const m = line.match(STATE_LINE);
    if (!m) die(`${label}: cannot read "${line.slice(0, 70)}" — expected [[state Name | /images/badge.png]]`);
    const file = path.join(root, m[2]);
    if (!fs.existsSync(file)) die(`${label}: the badge ${m[2]} does not exist`);
    const size = pngSize(file);
    if (!size) die(`${label}: ${m[2]} is not a PNG`);
    states.push({ name: m[1], badge: m[2], id: slugify(m[1]), size });
  }

  for (const raw of src.split('\n')) {
    const line = raw.trim();
    if (line.startsWith('::')) {
      closeList();
      card = card || [];
      const special = line.match(/^::([!@*]) (.+)$/);
      if (special) {
        const value = special[1] === '@' ? special[2].split(',').map((c) => c.trim()) : special[2];
        if (special[1] === '@') {
          for (const c of value) if (!CATEGORIES.includes(c)) die(`${label}: "${c}" is not an app category — use one of ${CATEGORIES.join(', ')}`);
        }
        card.push({ kind: special[1], value });
        continue;
      }
      const m = line.match(/^::(#?) (.+?) \| (.+)$/);
      if (!m) die(`${label}: cannot read the detour line "${line.slice(0, 70)}" — expected ":: Label | value", "::# Label | value", "::! Title" or "::@ Category, Category"`);
      card.push({ kind: m[1], label: m[2], value: m[3] });
      words += line.split(/\s+/).length;
      continue;
    }
    closeCard();
    if (!line) { closeList(); continue; }
    if (line === '[[states]]') {
      if (!states.length) die(`${label}: [[states]] needs at least one [[state]] line`);
      closeList();
      out.push(`      <nav class="state-nav reveal" id="states" aria-label="Jump to a state">\n` +
        `        <p class="state-nav-label">Jump to a state</p>\n` +
        `        <ul>\n` +
        states.map((st) => `          <li><a href="#${st.id}"><img src="${st.badge}" alt="" width="${st.size.w}" height="${st.size.h}">${esc(st.name)}</a></li>`).join('\n') +
        `\n        </ul>\n      </nav>`);
      continue;
    }
    if (line.startsWith('[[state ')) {
      const st = states.find((x) => line.includes(`[[state ${x.name} |`));
      closeList();
      out.push(`      <div class="state-head reveal" id="${st.id}">\n` +
        `        <img class="state-badge" src="${st.badge}" alt="${esc(st.name)} Route 66 Logbook badge" width="${st.size.w}" height="${st.size.h}" loading="lazy">\n` +
        `        <div>\n` +
        `          <h2>${esc(st.name)}</h2>\n` +
        `          <a class="state-top" href="#states">All states ↑</a>\n` +
        `        </div>\n` +
        `      </div>`);
      words += 1;
      continue;
    }
    if (/<[a-z/!]/i.test(line)) die(`${label}: raw HTML is not allowed — "${line.slice(0, 60)}"`);

    if (line.startsWith('![')) {
      const m = line.match(IMAGE_LINE);
      if (!m) die(`${label}: cannot read the photo line "${line.slice(0, 70)}" — expected ![description](/images/file.jpg "Caption")`);
      const [, alt, src, caption, variant] = m;
      if (!alt) die(`${label}: the photo ${src} needs a description between the [ ]`);
      const file = path.join(root, src);
      if (!fs.existsSync(file)) die(`${label}: the photo ${src} does not exist`);
      const size = jpegSize(file);
      if (!size) die(`${label}: cannot read the size of ${src} — is it really a JPEG?`);
      closeList();
      const cls = variant === 'screen' ? ' screen' : size.h > size.w ? ' upright' : '';
      out.push(`      <figure class="figure${cls} reveal">\n` +
        `        <img src="${src}" alt="${esc(alt)}" width="${size.w}" height="${size.h}" loading="lazy">\n` +
        (caption ? `        <figcaption>${inline(caption)}</figcaption>\n` : '') +
        `      </figure>`);
      continue;
    }
    if (line.startsWith('[[download ')) {
      const m = line.match(/^\[\[download (.+?) \| (\/downloads\/[^|\s]+) \| (\/images\/[^|\s]+\.jpe?g) \| (.+)\]\]$/);
      if (!m) die(`${label}: cannot read "${line.slice(0, 70)}" — expected [[download Label | /downloads/file.pdf | /images/preview.jpg | description]]`);
      const [, text, file, preview, alt] = m;
      for (const f of [file, preview]) if (!fs.existsSync(path.join(root, f))) die(`${label}: ${f} does not exist`);
      const size = jpegSize(path.join(root, preview));
      if (!size) die(`${label}: cannot read the size of ${preview}`);
      const bytes = fs.statSync(path.join(root, file)).size;
      const human = bytes >= 1e6 ? (bytes / 1e6).toFixed(1) + ' MB' : Math.round(bytes / 1e3) + ' KB';
      const ext = path.extname(file).slice(1).toUpperCase();
      closeList();
      out.push(`      <figure class="download-card reveal">\n` +
        `        <a href="${file}" download><img src="${preview}" alt="${esc(alt)}" width="${size.w}" height="${size.h}" loading="lazy"></a>\n` +
        `        <a class="btn-teal" href="${file}" download>\n` +
        `          <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 3v12"/><path d="m7 10 5 5 5-5"/><path d="M5 21h14"/></svg>\n` +
        `          ${esc(text)} <span class="btn-meta">${ext} · ${human}</span>\n` +
        `        </a>\n` +
        `      </figure>`);
      continue;
    }
    if (line.startsWith('>> ')) {
      const [figure, text] = line.slice(3).split(' | ');
      if (!figure || !text) die(`${label}: a fact call-out needs ">> figure | text" — got "${line.slice(0, 60)}"`);
      closeList();
      words += line.split(/\s+/).length;
      out.push(`      <aside class="fact reveal">\n` +
        `        <p class="fact-figure">${inline(figure.trim())}</p>\n` +
        `        <p class="fact-text">${inline(text.trim())}</p>\n` +
        `      </aside>`);
      continue;
    }
    if (line.startsWith('> ')) {
      closeList();
      words += line.split(/\s+/).length;
      out.push(`      <blockquote class="pullout reveal"><p>${inline(line.slice(2))}</p></blockquote>`);
      continue;
    }
    words += line.replace(/^(#+|-)\s/, '').split(/\s+/).length;

    if (line.startsWith('- ')) {
      (list = list || []).push(`        <li>${inline(line.slice(2))}</li>`);
      continue;
    }
    closeList();
    if (line === '{{cta}}') {
      out.push('      <p class="cta-row"><a class="btn-coral" href="#download">Explore Route 66 Logbook <span aria-hidden="true">→</span></a></p>');
    } else if (line.startsWith('### ')) {
      out.push(`      <h3>${inline(line.slice(4))}</h3>`);
    } else if (line.startsWith('## ')) {
      out.push(`      <h2>${inline(line.slice(3))}</h2>`);
    } else if (line.startsWith('#')) {
      die(`${label}: only ## and ### headings are allowed — the title comes from the front matter`);
    } else if (line.includes('{{')) {
      die(`${label}: unknown placeholder in "${line.slice(0, 60)}"`);
    } else {
      out.push(`      <p>${inline(line)}</p>`);
    }
  }
  closeList();
  closeCard();
  return [out.join('\n'), words];
}

function parseArticle(file, text, die, root) {
  const m = text.match(/^---\n([\s\S]*?)\n---\n([\s\S]*)$/);
  if (!m) die(`${file}: must start with front matter between --- lines`);
  const meta = {};
  for (const line of m[1].split('\n')) {
    const kv = line.match(/^([a-z]+):\s*(.*)$/);
    if (!kv) die(`${file}: cannot read front matter line "${line}"`);
    meta[kv[1]] = kv[2].trim();
  }
  for (const k of REQUIRED) if (!meta[k]) die(`${file}: front matter is missing "${k}"`);
  if (!GROUPS[meta.group]) die(`${file}: group must be one of ${Object.keys(GROUPS).join(', ')}`);
  if (!/^[a-z0-9-]+$/.test(meta.slug)) die(`${file}: slug may only use a-z, 0-9 and -`);
  if (meta.published && !/^\d{4}-\d{2}-\d{2}$/.test(meta.published)) die(`${file}: published must be YYYY-MM-DD`);
  if (meta.accent && !meta.title.includes(meta.accent)) die(`${file}: accent "${meta.accent}" is not part of the title`);
  meta.order = Number(meta.order);
  if (!Number.isInteger(meta.order)) die(`${file}: order must be a whole number`);
  const [body, words] = renderBody(m[2], file, die, root);
  return Object.assign(meta, { file, body, readTime: Math.max(1, Math.ceil(words / WORDS_PER_MINUTE)) });
}

module.exports = function buildGuide({ ROOT, SITE, die, write }) {
  const dir = path.join(ROOT, '_guides');
  const read = (f) => {
    try { return fs.readFileSync(path.join(ROOT, f), 'utf8'); }
    catch (e) { die(`cannot read ${f} — ${e.message}`); }
  };

  // The store icons are copied from the home page's own template, so there is
  // one source for each and they cannot drift.
  const home = read('index.template.html');
  const icon = (marker) => {
    const hit = home.match(new RegExp(`<path d="(${marker}[^"]*)"`));
    if (!hit) die(`guide: cannot find the store icon starting "${marker}" in index.template.html`);
    return hit[1];
  };
  const download = DOWNLOAD.replace('APPLE_PATH', icon('M18\\.71')).replace('ANDROID_PATH', icon('M17\\.6'));

  const articles = fs.readdirSync(dir)
    .filter((f) => /^\d+-.+\.md$/.test(f))
    .map((f) => parseArticle('_guides/' + f, read('_guides/' + f), die, ROOT))
    .sort((a, b) => a.order - b.order);
  if (!articles.length) die('guides: _guides/ has no articles');

  const seen = {};
  for (const a of articles) {
    if (seen[a.slug]) die(`guide: ${a.file} and ${seen[a.slug]} share the slug "${a.slug}"`);
    seen[a.slug] = a.file;
  }

  const hasPhoto = (a) => fs.existsSync(path.join(ROOT, 'images', 'guides', a.slug + '.jpg'));
  const photo = (a, indent, alt) =>
    `${indent}<div class="photo-cell reveal">\n` +
    `${indent}  <div class="photo-placeholder">images/guides/${a.slug}.jpg<br>16:10 · approx 1600 × 1000 px</div>\n` +
    `${indent}  <img src="/images/guides/${a.slug}.jpg" alt="${esc(alt)}" loading="lazy" onerror="this.remove()">\n` +
    `${indent}</div>`;
  const tile = (a) =>
    `        <a class="tile reveal" href="/guides/${a.slug}/">\n` +
    `          <div class="tile-photo">\n` +
    `            <div class="tile-photo-label">images/guides/${a.slug}.jpg</div>\n` +
    `            <img src="/images/guides/${a.slug}.jpg" alt="" loading="lazy" onerror="this.remove()">\n` +
    `          </div>\n` +
    `          <div class="tile-body">\n` +
    `            <p class="tile-kicker">${GROUPS[a.group].name} · ${a.readTime} min</p>\n` +
    `            <h3 class="tile-title">${esc(a.title)}</h3>\n` +
    `            <p class="tile-text">${esc(a.standfirst)}</p>\n` +
    `            <span class="tile-more">Read the guide →</span>\n` +
    `          </div>\n` +
    `        </a>`;
  const jsonld = (obj) => '  <script type="application/ld+json">\n' +
    JSON.stringify(obj, null, 2).split('\n').map((l) => '  ' + l).join('\n') + '\n  </script>\n';
  const fill = (tpl, values, label) => {
    const html = tpl.replace(/\{\{([a-zA-Z]+)\}\}/g, (m, k) => {
      if (!(k in values)) die(`${label}: template needs {{${k}}}, which is not defined`);
      return values[k];
    });
    const banner = `<!--\n  GENERATED FILE — DO NOT EDIT.\n  Built from ${label} by \`node build.js\`.\n  Any change made here is lost the next time the build runs.\n-->\n`;
    return html.replace(/^<!DOCTYPE html>\n/, `<!DOCTYPE html>\n${banner}`);
  };

  // ── one page per article ──
  const articleTpl = read('guide-article.template.html');
  const pages = [];
  for (const a of articles) {
    const url = `${SITE}/guides/${a.slug}/`;
    const ogImage = hasPhoto(a) ? `${SITE}/images/guides/${a.slug}.jpg` : `${SITE}/images/og-home.jpg`;

    // Keep reading: the next articles in the same group, wrapping round, then
    // the next ones overall if the group is too small to fill three.
    const same = articles.filter((b) => b.group === a.group);
    const i = same.indexOf(a);
    const related = same.slice(i + 1).concat(same.slice(0, i));
    for (const b of articles.slice(articles.indexOf(a) + 1).concat(articles)) {
      if (related.length >= 3) break;
      if (b !== a && !related.includes(b)) related.push(b);
    }

    const schema = {
      '@context': 'https://schema.org',
      '@type': 'Article',
      headline: a.title,
      description: a.description,
      image: ogImage,
      mainEntityOfPage: url,
      author: { '@type': 'Person', name: 'Carole Richard', url: `${SITE}/about/` },
      publisher: {
        '@type': 'Organization', name: 'Route 66 Logbook',
        logo: { '@type': 'ImageObject', url: `${SITE}/images/route66logbook-logo-shield.png` },
      },
    };
    if (a.published) schema.datePublished = a.published;
    const crumbs = {
      '@context': 'https://schema.org',
      '@type': 'BreadcrumbList',
      itemListElement: [
        { '@type': 'ListItem', position: 1, name: 'Home', item: `${SITE}/` },
        { '@type': 'ListItem', position: 2, name: 'Route 66 guides', item: `${SITE}/guides/` },
        { '@type': 'ListItem', position: 3, name: a.title, item: url },
      ],
    };

    const html = fill(articleTpl, {
      title: esc(a.title),
      heading: a.accent
        ? esc(a.title).replace(esc(a.accent), `<em>${esc(a.accent)}</em>`)
        : esc(a.title),
      description: esc(a.description),
      standfirst: esc(a.standfirst),
      url, ogImage,
      schema: jsonld(schema) + jsonld(crumbs),
      groupName: GROUPS[a.group].name,
      readTime: String(a.readTime),
      updated: a.updated ? `<span>Updated ${esc(a.updated)}</span>` : '',
      heroPhoto: photo(a, '        ', a.photoalt || a.title),
      body: a.body,
      related: related.slice(0, 3).map(tile).join('\n'),
      download,
    }, `guide-article.template.html + ${a.file}`);
    write(path.join('guides', a.slug, 'index.html'), html);
    pages.push(`/guides/${a.slug}/`);
  }

  // ── /guides/ ──
  const groups = Object.keys(GROUPS).map((g) => {
    const list = articles.filter((a) => a.group === g);
    if (!list.length) return '';
    return `    <!-- ${GROUPS[g].name.toUpperCase()} -->\n` +
      `    <section class="group shell wide">\n` +
      `      <div class="group-head reveal">\n` +
      `        <h2 class="group-title">${GROUPS[g].title}</h2>\n` +
      `        <span class="group-count">${list.length} guides</span>\n` +
      `      </div>\n` +
      `      <div class="tiles">\n${list.map(tile).join('\n')}\n      </div>\n` +
      `    </section>\n`;
  }).join('\n');

  const sources = read('_guides/sources.md').split('\n')
    .filter((l) => l.startsWith('- '))
    .map((l) => {
      const m = l.match(/^- \[([^\]]+)\]\((https?:\/\/[^)\s]+)\)$/);
      if (!m) die(`_guides/sources.md: expected "- [Name](https://…)", got "${l}"`);
      return `        <li><a href="${m[2]}" target="_blank" rel="noopener">${esc(m[1])}</a></li>`;
    }).join('\n');

  const list = {
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    name: 'Route 66 guides',
    itemListElement: articles.map((a, n) => ({
      '@type': 'ListItem', position: n + 1, url: `${SITE}/guides/${a.slug}/`, name: a.title,
    })),
  };

  write(path.join('guides', 'index.html'), fill(read('guide.template.html'), {
    url: `${SITE}/guides/`,
    schema: jsonld(list),
    groups, sources, download,
  }, 'guide.template.html + _guides/'));

  // ── "Keep reading" on hand-written pages ──
  // These pages are edited by hand, so only the part between the markers is
  // rewritten. A page that has lost its markers stops the build rather than
  // silently going without.
  for (const [file, slugs] of Object.entries(KEEP_READING)) {
    const html = read(file);
    const m = html.match(/(<!-- GUIDES:START[^>]*-->)[\s\S]*?(<!-- GUIDES:END -->)/);
    if (!m) die(`${file}: cannot find the GUIDES:START / GUIDES:END markers`);
    const tiles = slugs.map((s) => {
      const a = articles.find((x) => x.slug === s);
      if (!a) die(`build-guide.js: KEEP_READING for ${file} names "${s}", which is not an article`);
      return tile(a);
    }).join('\n');
    write(file, html.replace(m[0], m[1] + '\n' + tiles + '\n        ' + m[2]));
  }

  return { pages: ['/guides/'].concat(pages), count: articles.length };
};
