import type { Lang, ProjectFull, SiteContent } from '../content/types';

export const TITLE_SUFFIX_PROJECT = 'COMPA Architecture';

export function pageTitle(site: SiteContent, name: string): string {
  return `${name} | ${site.brand.name}`;
}

export function projectTitle(site: SiteContent, p: ProjectFull, lang: Lang): string {
  const custom = p.seo.title[lang]?.trim();
  if (custom) return custom;
  const name = p.title[lang] || p.title.vi;
  const loc = p.location[lang] || p.location.vi;
  return loc ? `${name} – ${loc} | ${TITLE_SUFFIX_PROJECT}` : `${name} | ${site.brand.name}`;
}

export function firstSentence(text: string, max = 160): string {
  const t = text.trim().replace(/\s+/g, ' ');
  if (!t) return '';
  const m = t.match(/^.+?[.!?](\s|$)/);
  let s = (m ? m[0] : t).trim();
  if (s.length > max) s = s.slice(0, max - 1).replace(/\s+\S*$/, '') + '…';
  return s;
}

export function projectDescription(site: SiteContent, p: ProjectFull, lang: Lang): string {
  return (
    p.seo.description[lang]?.trim() ||
    firstSentence(p.description[lang] || '') ||
    site.seo.defaultDescription[lang]
  );
}
