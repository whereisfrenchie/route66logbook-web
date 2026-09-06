#!/usr/bin/env node
/**
 * Build the home page in English, French and Spanish.
 *
 *   node build.js
 *
 * Reads  index.template.html  +  strings.{en,fr,es}.json
 * Writes index.html, fr/index.html, es/index.html
 *
 * WHY THIS EXISTS
 * Three hand-maintained copies of a 300-line page would be 73% identical
 * markup, and every structural change would be a three-way edit with nothing
 * on screen to tell you when you only did two of them. It also means the
 * Spanish lives in one file that can be handed to a native reviewer who has
 * never seen this repo — they edit strings.es.json and nothing else.
 *
 * RULES
 * - It fails loudly. A missing key, an unused key, an unresolved placeholder
 *   or a file it cannot write all stop the build with a non-zero exit. There
 *   are no silent skips and no half-written pages: each file is written to a
 *   temporary path and renamed only once it is complete.
 * - Every output carries a DO-NOT-EDIT banner. Edit the template or the
 *   strings, never the generated HTML.
 * - Values may reference other values, e.g. "{{n.miles}} miles", so a figure
 *   like the mileage is written once per language instead of five times.
 */
'use strict';
const fs   = require('fs');
const path = require('path');

const ROOT     = __dirname;
const TEMPLATE = path.join(ROOT, 'index.template.html');
const LANGS    = [
  { code: 'en', strings: 'strings.en.json', out: 'index.html' },
  { code: 'fr', strings: 'strings.fr.json', out: path.join('fr', 'index.html') },
  { code: 'es', strings: 'strings.es.json', out: path.join('es', 'index.html') },
];

const PLACEHOLDER = /\{\{([^}]+)\}\}/g;

const SITE = 'https://route66logbook.com';

/**
 * Pages for the sitemap. The three home pages are handled separately because
 * they need xhtml:link alternates; these are the standalone English ones.
 * /delete-account is deliberately absent — it is a support destination, not
 * something to surface in search.
 */
const OTHER_PAGES = [
  '/about/', '/help/', '/history/', '/prepare/',
  '/privacy/', '/terms/', '/community-guidelines/',
];

/**
 * SoftwareApplication, English home page only. Not on /fr/ or /es/: it points
 * at store listings that are still English, and asserting a French app page
 * that resolves to English would be a claim we cannot back.
 *
 * No aggregateRating. We have no ratings data, and inventing one would be a
 * fabricated review. No paid offer either — the unlock price varies by
 * storefront and is set in RevenueCat, so the only price this file can state
 * honestly is the free download.
 */
function schemaFor(values) {
  return {
    '@context': 'https://schema.org',
    '@type': 'SoftwareApplication',
    name: 'Route 66 Logbook',
    description: values['meta.description'],
    applicationCategory: 'TravelApplication',
    operatingSystem: 'iOS, Android',
    url: SITE + '/',
    image: SITE + '/images/og-home.jpg',
    offers: {
      '@type': 'Offer',
      price: '0',
      priceCurrency: 'USD',
      availability: 'https://schema.org/InStock',
    },
    sameAs: [
      'https://apps.apple.com/app/route-66-logbook/id6774524322',
      'https://play.google.com/store/apps/details?id=com.route66logbook.app',
      'https://www.instagram.com/route66logbook/',
      'https://www.facebook.com/Route66Logbook/',
    ],
  };
}

/**
 * Redirect on first visit, English page only. /fr/ and /es/ never carry this,
 * which is what makes a loop impossible.
 */
const REDIRECT = `  <script>
    /* First-visit language redirect. ENGLISH PAGE ONLY — /fr/ and /es/ never
       carry this script, which is what makes a redirect loop impossible.
       It runs before the page renders but hides nothing: if it throws, if
       storage is unavailable, or if the browser is not French or Spanish, the
       English page simply renders. Never fails to a blank screen. */
    (function () {
      try {
        var qs = location.search;
        /* An explicit ?lang=en is a decision. Record it and never redirect. */
        if (qs.indexOf('lang=en') > -1) { try { localStorage.setItem('r66lang', 'en'); } catch (e) {} return; }
        /* A stored preference always wins over the browser's languages — and it
           is acted on, not merely obeyed by standing still. Someone who chose
           Français and later types the bare domain wants French, not English.
           Choosing English stores 'en', which lands here and stays put, so the
           switcher still always wins. */
        var stored = null;
        try { stored = localStorage.getItem('r66lang'); } catch (e) { return; }
        if (stored === 'en') return;
        if (stored === 'fr') { location.replace('/fr/'); return; }
        if (stored === 'es') { location.replace('/es/'); return; }
        /* Anything else stored is not a language we have — fall through. */
        var langs = navigator.languages || [navigator.language || ''];
        for (var i = 0; i < langs.length; i++) {
          var primary = String(langs[i] || '').toLowerCase().split('-')[0];
          if (primary === 'fr') { location.replace('/fr/'); return; }
          if (primary === 'es') { location.replace('/es/'); return; }
          if (primary === 'en') { return; }
        }
      } catch (e) { /* render English */ }
    })();
  </script>
`;

function die(msg) {
  console.error('\nbuild failed: ' + msg + '\n');
  process.exit(1);
}

function readJson(file) {
  const full = path.join(ROOT, file);
  let raw;
  try { raw = fs.readFileSync(full, 'utf8'); }
  catch (e) { die(`cannot read ${file} — ${e.message}`); }
  try { return JSON.parse(raw); }
  catch (e) { die(`${file} is not valid JSON — ${e.message}`); }
}

/**
 * Resolve {{...}} inside the string values themselves. `seen` collects the keys
 * referenced this way so that a value used only by another value — the mileage,
 * say — is not later reported as unused.
 */
function resolveValues(dict, label, seen) {
  const out = Object.assign({}, dict);
  for (let pass = 0; pass < 5; pass++) {
    let changed = false;
    for (const key of Object.keys(out)) {
      const next = String(out[key]).replace(PLACEHOLDER, (m, name) => {
        const k = name.trim();
        if (!(k in out)) die(`${label}: "${key}" refers to {{${k}}}, which does not exist`);
        seen.add(k);
        return out[k];
      });
      if (next !== out[key]) { out[key] = next; changed = true; }
    }
    if (!changed) return out;
  }
  die(`${label}: values still reference each other after 5 passes — is there a loop?`);
}

let template;
try { template = fs.readFileSync(TEMPLATE, 'utf8'); }
catch (e) { die(`cannot read index.template.html — ${e.message}`); }

const expected = Object.keys(readJson(LANGS[0].strings)).sort();
let wrote = 0;

for (const lang of LANGS) {
  const raw = readJson(lang.strings);

  // Every language must carry exactly the same keys. A missing one would fall
  // back to English silently, which is the failure this check exists to stop.
  const got = Object.keys(raw).sort();
  const missing = expected.filter((k) => !got.includes(k));
  const extra   = got.filter((k) => !expected.includes(k));
  if (missing.length) die(`${lang.strings} is missing: ${missing.join(', ')}`);
  if (extra.length)   die(`${lang.strings} has keys no other language has: ${extra.join(', ')}`);

  const used = new Set();
  const values = resolveValues(raw, lang.strings, used);

  // Derived, not translated: the switcher's current-language marker and the
  // English-only redirect. Keeping these out of the strings files means a
  // translator never has to understand them.
  values['@redirect'] = lang.code === 'en' ? REDIRECT : '';
  values['@schema'] = lang.code === 'en'
    ? '  <script type="application/ld+json">\n' +
      JSON.stringify(schemaFor(values), null, 2).split('\n').map((l) => '  ' + l).join('\n') +
      '\n  </script>\n'
    : '';
  for (const c of ['en', 'fr', 'es']) {
    values['@current.' + c] = c === lang.code ? ' aria-current="page" class="is-current"' : '';
  }

  let html = template.replace(PLACEHOLDER, (m, name) => {
    const key = name.trim();
    if (!(key in values)) die(`${lang.strings}: template needs {{${key}}}, which is not defined`);
    used.add(key);
    return values[key];
  });

  const unused = Object.keys(raw).filter((k) => !used.has(k));
  if (unused.length) die(`${lang.strings}: these keys are never used by the template: ${unused.join(', ')}`);

  const left = html.match(PLACEHOLDER);
  if (left) die(`${lang.out}: unresolved placeholders remain — ${left.join(', ')}`);

  const banner = `<!--\n  GENERATED FILE — DO NOT EDIT.\n  Built from index.template.html + ${lang.strings} by \`node build.js\`.\n  Any change made here is lost the next time the build runs.\n-->\n`;
  html = html.replace(/^<!DOCTYPE html>\n/, `<!DOCTYPE html>\n${banner}`);

  // Write-then-rename, so a crash mid-write can never leave a half a page.
  const dest = path.join(ROOT, lang.out);
  const tmp  = dest + '.tmp';
  try {
    fs.mkdirSync(path.dirname(dest), { recursive: true });
    fs.writeFileSync(tmp, html, 'utf8');
    fs.renameSync(tmp, dest);
  } catch (e) {
    try { fs.unlinkSync(tmp); } catch (_) {}
    die(`cannot write ${lang.out} — ${e.message}`);
  }

  console.log(`  ${lang.out.padEnd(15)} ${Object.keys(raw).length} strings, ${html.length} bytes`);
  wrote++;
}

// ── sitemap.xml ───────────────────────────────────────────────────────────────
//
// The three home pages are one page in three languages, not three competing
// pages, so each entry lists all three alternates plus x-default — the same
// rule the hreflang tags follow. No <lastmod>: it is only worth having if it
// is true, and keeping it true by hand is exactly the kind of derived value
// that rots.
const alternates = [
  `    <xhtml:link rel="alternate" hreflang="en" href="${SITE}/"/>`,
  `    <xhtml:link rel="alternate" hreflang="fr" href="${SITE}/fr/"/>`,
  `    <xhtml:link rel="alternate" hreflang="es" href="${SITE}/es/"/>`,
  `    <xhtml:link rel="alternate" hreflang="x-default" href="${SITE}/"/>`,
].join('\n');

const homeEntries = ['/', '/fr/', '/es/'].map((path) =>
  `  <url>\n    <loc>${SITE}${path}</loc>\n${alternates}\n  </url>`
);
const otherEntries = OTHER_PAGES.map((path) => `  <url>\n    <loc>${SITE}${path}</loc>\n  </url>`);

const sitemap =
  '<?xml version="1.0" encoding="UTF-8"?>\n' +
  '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"\n' +
  '        xmlns:xhtml="http://www.w3.org/1999/xhtml">\n' +
  homeEntries.concat(otherEntries).join('\n') + '\n</urlset>\n';

const robots = [
  'User-agent: *',
  'Allow: /',
  '',
  `Sitemap: ${SITE}/sitemap.xml`,
  '',
].join('\n');

for (const [name, body] of [['sitemap.xml', sitemap], ['robots.txt', robots]]) {
  const dest = path.join(ROOT, name);
  const tmp = dest + '.tmp';
  try {
    fs.writeFileSync(tmp, body, 'utf8');
    fs.renameSync(tmp, dest);
  } catch (e) {
    try { fs.unlinkSync(tmp); } catch (_) {}
    die(`cannot write ${name} — ${e.message}`);
  }
  console.log(`  ${name.padEnd(15)} ${body.length} bytes`);
}

console.log(`\nBuilt ${wrote} pages, a sitemap and robots.txt.\n`);
