// Static SEO checks on the built dist/ (run after `npm run build`).
// Checks every prerendered page for title, description, canonical, hreflang, OG, valid JSON-LD,
// exactly one <h1>, visible content without JS, NAP consistency, and sitemap/robots/headers rules.
import fs from 'node:fs';
import path from 'node:path';

const DIST = path.join(process.cwd(), 'dist');
const site = JSON.parse(fs.readFileSync(path.join(process.cwd(), 'content', 'site.json'), 'utf8'));
let fails = 0;
const fail = (m) => {
  fails++;
  console.log('FAIL', m);
};

function* htmlFiles(dir) {
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const f = path.join(dir, e.name);
    if (e.isDirectory()) yield* htmlFiles(f);
    else if (e.name === 'index.html') yield f;
  }
}

const decode = (s) => s.replace(/&amp;/g, '&').replace(/&quot;/g, '"').replace(/&lt;/g, '<').replace(/&gt;/g, '>');
let pages = 0;
for (const file of htmlFiles(DIST)) {
  const rel = '/' + path.relative(DIST, path.dirname(file)).replace(/\\/g, '/');
  const url = rel === '/' ? '/' : rel + '/';
  if (url === '/') { /* root */ }
  if (url.startsWith('/admin')) {
    const h = fs.readFileSync(file, 'utf8');
    if (!/name="robots" content="noindex/.test(h)) fail(`${url}: admin missing noindex`);
    if (/<div id="root"><\/div>/.test(h) === false) fail(`${url}: admin should not prerender content`);
    continue;
  }
  if (url === '/' && !fs.existsSync(path.join(DIST, 'index.html'))) continue;
  pages++;
  const h = fs.readFileSync(file, 'utf8');
  const need = [
    [/<title data-seo>[^<]{10,}<\/title>/, 'title'],
    [/<meta name="description" content="[^"]{50,}"/, 'description'],
    [/<link rel="canonical" href="[^"]+"/, 'canonical'],
    [/property="og:title"/, 'og:title'],
    [/property="og:image" content="[^"]+\.jpg"/, 'og:image'],
    [/property="og:locale"/, 'og:locale'],
    [/name="twitter:card" content="summary_large_image"/, 'twitter:card'],
  ];
  for (const [re, name] of need) if (!re.test(h)) fail(`${url}: missing ${name}`);
  if (!/hreflang="vi"/.test(h) || !/hreflang="en"/.test(h) || !/hreflang="x-default"/.test(h)) fail(`${url}: missing hreflang`);
  const canonical = h.match(/<link rel="canonical" href="([^"]+)"/)?.[1] ?? '';
  if (!canonical.endsWith(url)) fail(`${url}: canonical ${canonical} does not point to itself`);
  const h1 = (h.match(/<h1[\s>]/g) || []).length;
  if (h1 !== 1) fail(`${url}: ${h1} <h1>`);
  const lang = h.match(/<html lang="(\w+)"/)?.[1];
  if (lang !== (url.startsWith('/en/') ? 'en' : 'vi')) fail(`${url}: html lang=${lang}`);
  if (!/<div id="root"><div/.test(h)) fail(`${url}: no prerendered content`);
  if (/name="keywords"/.test(h)) fail(`${url}: meta keywords present`);
  // JSON-LD
  const blocks = [...h.matchAll(/<script type="application\/ld\+json" data-seo>(.*?)<\/script>/g)].map((m) => m[1]);
  if (!blocks.length) fail(`${url}: no JSON-LD`);
  for (const b of blocks) {
    let data;
    try {
      data = JSON.parse(b);
    } catch (e) {
      fail(`${url}: invalid JSON-LD (${e.message})`);
      continue;
    }
    if (data['@id']?.endsWith('#business')) {
      const a = data.address;
      const c = site.contact;
      if (data.name !== site.brand.name) fail(`${url}: JSON-LD name mismatch`);
      if (data.telephone !== c.phoneE164) fail(`${url}: JSON-LD phone mismatch`);
      if (a.streetAddress !== c.address.streetAddress || a.addressLocality !== c.address.addressLocality || a.addressRegion !== c.address.addressRegion)
        fail(`${url}: JSON-LD address mismatch`);
      if ('geo' in data && !c.geo) fail(`${url}: geo present without verified value`);
      if ('openingHoursSpecification' in data || ('openingHours' in data && !c.openingHours.length)) fail(`${url}: opening hours without value`);
      if (JSON.stringify(data).includes('Rating') || JSON.stringify(data).includes('Review')) fail(`${url}: rating/review markup`);
    }
    if (data['@type'] === 'CreativeWork' && 'creator' in data) {
      const slug = url.split('/').filter(Boolean).pop();
      const pf = path.join(process.cwd(), 'content', 'projects', `${slug}.json`);
      if (fs.existsSync(pf) && JSON.parse(fs.readFileSync(pf, 'utf8')).isDemo) fail(`${url}: demo project attributed to business`);
    }
  }
  // NAP in the footer must match the config exactly (home is a full-screen hero without footer).
  if (url !== '/' && url !== '/en/') {
    const display = site.contact.address.display[lang === 'en' ? 'en' : 'vi'];
    if (!decode(h).includes(display)) fail(`${url}: address "${display}" not found`);
    if (!h.includes(site.contact.phone)) fail(`${url}: phone not found`);
  }
}

// 404
const nf = fs.readFileSync(path.join(DIST, '404.html'), 'utf8');
if (!/noindex/.test(nf) || !/Không tìm thấy trang/.test(nf) || !/Page not found/.test(nf)) fail('404.html not bilingual/noindex');

// sitemap
const sm = fs.existsSync(path.join(DIST, 'sitemap.xml')) ? fs.readFileSync(path.join(DIST, 'sitemap.xml'), 'utf8') : '';
if (sm) {
  if (/\/admin/.test(sm)) fail('sitemap contains /admin');
  for (const f of fs.readdirSync(path.join(process.cwd(), 'content', 'projects'))) {
    const p = JSON.parse(fs.readFileSync(path.join(process.cwd(), 'content', 'projects', f), 'utf8'));
    const type = (site.projectTypes ?? []).find((t) => t.id === p.typeId);
    const inMap = sm.includes(`/${p.slug}/</loc>`);
    if (p.status === 'published' && type && !sm.includes(`/du-an/${type.slug.vi}/${p.slug}/`)) fail(`sitemap: ${p.slug} not under /du-an/${type.slug.vi}/`);
    if (p.status === 'published' && !inMap) fail(`sitemap missing ${p.slug}`);
    if (p.status !== 'published' && inMap) fail(`sitemap contains draft ${p.slug}`);
  }
  if (!/xhtml:link rel="alternate" hreflang="en"/.test(sm)) fail('sitemap missing hreflang');
}
const robots = fs.readFileSync(path.join(DIST, 'robots.txt'), 'utf8');
if (sm && !/Sitemap: /.test(robots)) fail('robots.txt missing Sitemap line');
const headers = fs.readFileSync(path.join(DIST, '_headers'), 'utf8');
if (!/\/admin\/\*\n {2}X-Robots-Tag: noindex, nofollow\n {2}Cache-Control: no-store/.test(headers)) fail('_headers admin rule');

console.log(`\nchecked ${pages} pages — ${fails ? fails + ' problem(s)' : 'all SEO checks passed'}`);
process.exit(fails ? 1 : 0);
