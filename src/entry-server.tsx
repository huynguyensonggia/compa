// Used only at build time by scripts/prerender.mjs.
import { StrictMode } from 'react';
import { renderToString } from 'react-dom/server';
import { StaticRouter } from 'react-router-dom/server';
import { App } from './App';
import { ContentProvider } from './content/ContentContext';
import { getStaticContent, getStaticRecords } from './content/static';
import { HeadCollectorCtx, type HeadCollector } from './seo/Seo';
import { analyticsHeadHtml, buildHeadHtml } from './seo/head';
import { publishedProjects } from './content/resolve';
import { paths } from './routing/paths';
import { SITE_URL, OG_DEFAULT_PATH, ogProjectPath } from './seo/config';
import type { Lang } from './content/types';

const content = getStaticContent();

export function render(url: string) {
  const collector: HeadCollector = { data: null };
  const html = renderToString(
    <StrictMode>
      <HeadCollectorCtx.Provider value={collector}>
        <ContentProvider initial={content}>
          <StaticRouter location={url}>
            <App />
          </StaticRouter>
        </ContentProvider>
      </HeadCollectorCtx.Provider>
    </StrictMode>,
  );
  const d = collector.data;
  const head = [d ? buildHeadHtml(d, content.site) : '', analyticsHeadHtml(content.site)].filter(Boolean).join('\n    ');
  return { html, head, lang: d?.lang ?? 'vi' };
}

/** Admin shell head: never indexed, no content prerendered. */
export function adminHead() {
  return `<title>Quản trị | ${content.site.brand.name}</title>\n    <meta name="robots" content="noindex, nofollow">`;
}

export interface RouteEntry {
  path: string;
  lang: Lang;
  alternates: Record<Lang, string>;
  lastmod?: string;
}

/** Every public, published page. Drafts are never prerendered nor listed in the sitemap. */
export function listRoutes(): RouteEntry[] {
  const { site } = content;
  const projects = publishedProjects(content.projects);
  const latest = projects.map((p) => p.updatedAt).sort().pop() || site.updatedAt;
  const out: RouteEntry[] = [];
  const pair = (make: (l: Lang) => string, lastmod?: string) => {
    const alternates = { vi: make('vi'), en: make('en') };
    out.push({ path: alternates.vi, lang: 'vi', alternates, lastmod });
    out.push({ path: alternates.en, lang: 'en', alternates, lastmod });
  };
  pair(paths.home, site.updatedAt);
  pair(paths.projects, latest);
  for (const p of projects) pair((l) => paths.project(l, p.slug), p.updatedAt);
  pair(paths.studio, site.updatedAt);
  pair(paths.contact, site.updatedAt);
  if (site.services.status === 'published') {
    pair(paths.services, site.updatedAt);
    for (const s of site.services.items.filter((i) => i.status === 'published')) {
      pair((l) => paths.service(l, s.slug[l]), site.updatedAt);
    }
  }
  return out;
}

/** Open Graph images to generate: project cover (or chosen image) + site default. */
export function ogJobs() {
  const { assets } = getStaticRecords();
  const byId = new Map(assets.map((a) => [a.id, a]));
  const jobs: Array<{ out: string; asset: unknown; focalPoint: unknown }> = [];
  const def = content.site.seo.defaultOgAssetId ?? content.site.hero.slides[0]?.assetId;
  const defSlide = content.site.hero.slides.find((s) => s.assetId === def);
  if (def && byId.has(def)) jobs.push({ out: OG_DEFAULT_PATH, asset: byId.get(def), focalPoint: defSlide?.focalPoint ?? null });
  for (const p of publishedProjects(content.projects)) {
    const id = p.seo.ogAssetId || p.coverAssetId;
    if (!id || !byId.has(id)) continue;
    const img = p.images.find((i) => i.assetId === id);
    jobs.push({ out: ogProjectPath(p.slug), asset: byId.get(id), focalPoint: img?.focalPoint ?? null });
  }
  return jobs;
}

export function redirects() {
  return content.redirects;
}

export function siteSettings() {
  return { siteUrl: SITE_URL, allowIndexing: content.site.seo.allowIndexing, site: content.site };
}
