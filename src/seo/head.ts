import type { Lang, SiteContent } from '../content/types';
import { absUrl, OG_DEFAULT_PATH } from './config';
import { businessJsonLd } from './jsonld';

export interface HeadData {
  lang: Lang;
  title: string;
  description: string;
  /** Canonical path of this page (with trailing slash). */
  path: string;
  /** Equivalent pages per language, used for hreflang. */
  alternates?: Partial<Record<Lang, string>>;
  ogImagePath?: string;
  ogType?: 'website' | 'article';
  jsonLd?: object[];
  noindex?: boolean;
  preloadImage?: { src: string; srcSet?: string; sizes?: string };
}

const esc = (s: string) =>
  s.replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

const jsonScript = (obj: object) =>
  `<script type="application/ld+json" data-seo>${JSON.stringify(obj).replace(/</g, '\\u003c')}</script>`;

/** Build every per-page head tag as an HTML string (used by the prerenderer and the client). */
export function buildHeadHtml(d: HeadData, site: SiteContent): string {
  const tags: string[] = [];
  const canonical = absUrl(d.path);
  const ogImage = absUrl(d.ogImagePath || OG_DEFAULT_PATH);
  tags.push(`<title data-seo>${esc(d.title)}</title>`);
  tags.push(`<meta name="description" content="${esc(d.description)}" data-seo>`);
  const noindex = d.noindex || !site.seo.allowIndexing;
  tags.push(`<meta name="robots" content="${noindex ? 'noindex, nofollow' : 'index, follow, max-image-preview:large'}" data-seo>`);
  tags.push(`<link rel="canonical" href="${esc(canonical)}" data-seo>`);
  if (d.alternates?.vi && d.alternates?.en) {
    tags.push(`<link rel="alternate" hreflang="vi" href="${esc(absUrl(d.alternates.vi))}" data-seo>`);
    tags.push(`<link rel="alternate" hreflang="en" href="${esc(absUrl(d.alternates.en))}" data-seo>`);
    tags.push(`<link rel="alternate" hreflang="x-default" href="${esc(absUrl(d.alternates.vi))}" data-seo>`);
  }
  const og: Array<[string, string]> = [
    ['og:type', d.ogType || 'website'],
    ['og:site_name', site.brand.name],
    ['og:title', d.title],
    ['og:description', d.description],
    ['og:url', canonical],
    ['og:image', ogImage],
    ['og:image:width', '1200'],
    ['og:image:height', '630'],
    ['og:locale', d.lang === 'vi' ? 'vi_VN' : 'en_US'],
    ['og:locale:alternate', d.lang === 'vi' ? 'en_US' : 'vi_VN'],
  ];
  for (const [p, c] of og) tags.push(`<meta property="${p}" content="${esc(c)}" data-seo>`);
  tags.push(`<meta name="twitter:card" content="summary_large_image" data-seo>`);
  tags.push(`<meta name="twitter:title" content="${esc(d.title)}" data-seo>`);
  tags.push(`<meta name="twitter:description" content="${esc(d.description)}" data-seo>`);
  tags.push(`<meta name="twitter:image" content="${esc(ogImage)}" data-seo>`);
  if (site.seo.googleSiteVerification) {
    tags.push(`<meta name="google-site-verification" content="${esc(site.seo.googleSiteVerification)}" data-seo>`);
  }
  if (d.preloadImage) {
    const p = d.preloadImage;
    tags.push(
      `<link rel="preload" as="image" href="${esc(p.src)}"${p.srcSet ? ` imagesrcset="${esc(p.srcSet)}"` : ''}${
        p.sizes ? ` imagesizes="${esc(p.sizes)}"` : ''
      } fetchpriority="high" data-seo>`,
    );
  }
  tags.push(jsonScript(businessJsonLd(site)));
  for (const obj of d.jsonLd ?? []) tags.push(jsonScript(obj));
  return tags.join('\n    ');
}

/** Analytics loaders — emitted only when an ID is configured. */
export function analyticsHeadHtml(site: SiteContent): string {
  const { gtmId, ga4Id } = site.seo;
  const out: string[] = [];
  if (gtmId && /^GTM-[A-Z0-9]+$/.test(gtmId)) {
    out.push(
      `<script>(function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src='https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);})(window,document,'script','dataLayer','${gtmId}');</script>`,
    );
  } else if (ga4Id && /^G-[A-Z0-9]+$/.test(ga4Id)) {
    out.push(
      `<script async src="https://www.googletagmanager.com/gtag/js?id=${ga4Id}"></script><script>window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments);}gtag('js',new Date());gtag('config','${ga4Id}');</script>`,
    );
  }
  return out.join('\n    ');
}

/** Client-side: replace previous per-page tags with the new set. */
export function applyHead(d: HeadData, site: SiteContent) {
  document.documentElement.lang = d.lang;
  document.head.querySelectorAll('[data-seo]').forEach((el) => el.remove());
  const tpl = document.createElement('template');
  tpl.innerHTML = buildHeadHtml(d, site);
  // Scripts inserted via innerHTML do not execute, which is correct for JSON-LD.
  document.head.append(tpl.content);
}
