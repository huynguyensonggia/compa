// Static site generation: one HTML file per public route with head tags, JSON-LD and content,
// plus sitemap.xml, robots.txt, _headers, _redirects, 404.html, admin shell and OG images.
import fs from 'node:fs';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import { buildOgImage } from './lib/images.mjs';

const ROOT = process.cwd();
const DIST = path.join(ROOT, 'dist');
const SSR_ENTRY = path.join(ROOT, 'dist-ssr', 'entry-server.js');

const ssr = await import(pathToFileURL(SSR_ENTRY).href);
const template = fs.readFileSync(path.join(DIST, 'index.html'), 'utf8');
const { siteUrl, allowIndexing } = ssr.siteSettings();

function page({ head, html, lang }) {
  return template
    .replace('<html lang="vi">', `<html lang="${lang}">`)
    .replace('<!--app-head-->', head)
    .replace('<!--app-html-->', html);
}

function write(rel, content) {
  const file = path.join(DIST, rel);
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, content);
}

// 1) Public routes
const routes = ssr.listRoutes();
for (const r of routes) {
  const out = ssr.render(r.path);
  write(path.join(r.path, 'index.html'), page(out));
}
console.log(`prerender: ${routes.length} pages`);

// 2) 404 (bilingual) — Cloudflare Pages serves it with a real 404 status.
write('404.html', page(ssr.render('/404.html')));

// 3) Admin shell: no data prerendered, never indexed.
write(
  'admin/index.html',
  template
    .replace('<!--app-head-->', ssr.adminHead())
    .replace('<!--app-html-->', ''),
);

// 4) Open Graph images 1200×630
for (const job of ssr.ogJobs()) await buildOgImage(job.asset, job.out.replace(/^\//, ''), job.focalPoint);

// 5) sitemap.xml + robots.txt (only with SITE_URL)
const xmlEsc = (s) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;');
if (siteUrl) {
  const urls = routes
    .map((r) => {
      const alt = ['vi', 'en']
        .map((l) => `    <xhtml:link rel="alternate" hreflang="${l}" href="${xmlEsc(siteUrl + r.alternates[l])}"/>`)
        .concat(`    <xhtml:link rel="alternate" hreflang="x-default" href="${xmlEsc(siteUrl + r.alternates.vi)}"/>`)
        .join('\n');
      const lastmod = r.lastmod ? `\n    <lastmod>${r.lastmod.slice(0, 10)}</lastmod>` : '';
      return `  <url>\n    <loc>${xmlEsc(siteUrl + r.path)}</loc>${lastmod}\n${alt}\n  </url>`;
    })
    .join('\n');
  write(
    'sitemap.xml',
    `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">\n${urls}\n</urlset>\n`,
  );
}
write('robots.txt', `User-agent: *\nDisallow: /admin\n${siteUrl ? `\nSitemap: ${siteUrl}/sitemap.xml\n` : ''}`);

// 6) _headers (Cloudflare Pages)
const htmlPaths = ['/', '/du-an/*', '/en/*', '/gioi-thieu/*', '/lien-he/*', '/dich-vu/*', '/404.html'];
const headers = [
  '/*',
  '  X-Content-Type-Options: nosniff',
  '  Referrer-Policy: strict-origin-when-cross-origin',
  '  X-Frame-Options: SAMEORIGIN',
  ...(allowIndexing ? [] : ['  X-Robots-Tag: noindex, nofollow']),
  '',
  '/admin',
  '  X-Robots-Tag: noindex, nofollow',
  '  Cache-Control: no-store',
  '',
  '/admin/*',
  '  X-Robots-Tag: noindex, nofollow',
  '  Cache-Control: no-store',
  '',
  '/assets/*',
  '  Cache-Control: public, max-age=31536000, immutable',
  '',
  '/fonts/*',
  '  Cache-Control: public, max-age=31536000, immutable',
  '',
  '/images/*',
  '  Cache-Control: public, max-age=2592000',
  '',
  '/og/*',
  '  Cache-Control: public, max-age=86400',
  '',
  ...htmlPaths.flatMap((p) => [p, '  Cache-Control: public, max-age=0, must-revalidate', '']),
];
write('_headers', headers.join('\n'));

// 7) _redirects: admin SPA fallback + 301 for changed slugs (both with and without trailing slash)
const lines = ['# Admin is client-rendered', '/admin/* /admin/index.html 200', '', '# Old project slugs (generated from content/redirects.json)'];
for (const r of ssr.redirects()) {
  lines.push(`/du-an/${r.from}/ /du-an/${r.to}/ 301`);
  lines.push(`/du-an/${r.from} /du-an/${r.to}/ 301`);
  lines.push(`/en/projects/${r.from}/ /en/projects/${r.to}/ 301`);
  lines.push(`/en/projects/${r.from} /en/projects/${r.to}/ 301`);
}
write('_redirects', lines.join('\n') + '\n');

fs.rmSync(path.join(ROOT, 'dist-ssr'), { recursive: true, force: true });
console.log(`prerender: done (SITE_URL=${siteUrl || '—'}, allowIndexing=${allowIndexing})`);
