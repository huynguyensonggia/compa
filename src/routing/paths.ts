import type { Lang, SiteContent, Category } from '../content/types';

/**
 * Public URL structure (trailing slash everywhere). Vietnamese at the root, English under /en/.
 * Projects are nested under their type: /du-an/{type}/{project}/.
 */
export const paths = {
  home: (l: Lang) => (l === 'vi' ? '/' : '/en/'),
  projects: (l: Lang) => (l === 'vi' ? '/du-an/' : '/en/projects/'),
  projectType: (l: Lang, typeSlug: string) => (l === 'vi' ? `/du-an/${typeSlug}/` : `/en/projects/${typeSlug}/`),
  project: (l: Lang, typeSlug: string, slug: string) => (l === 'vi' ? `/du-an/${typeSlug}/${slug}/` : `/en/projects/${typeSlug}/${slug}/`),
  pricing: (l: Lang) => (l === 'vi' ? '/don-gia/' : '/en/pricing/'),
  studio: (l: Lang) => (l === 'vi' ? '/gioi-thieu/' : '/en/studio/'),
  contact: (l: Lang) => (l === 'vi' ? '/lien-he/' : '/en/contact/'),
  services: (l: Lang) => (l === 'vi' ? '/dich-vu/' : '/en/services/'),
  service: (l: Lang, slug: string) => (l === 'vi' ? `/dich-vu/${slug}/` : `/en/services/${slug}/`),
};

export function langFromPath(pathname: string): Lang {
  return pathname === '/en' || pathname.startsWith('/en/') ? 'en' : 'vi';
}

export const withSlash = (p: string) => (p.endsWith('/') ? p : p + '/');

/** Map the current URL to the equivalent page in the other language. */
export function translatePath(pathname: string, target: Lang, site: SiteContent): string {
  const p = withSlash(pathname);
  const simple: Array<[string, string]> = [
    ['/', '/en/'],
    ['/du-an/', '/en/projects/'],
    ['/gioi-thieu/', '/en/studio/'],
    ['/lien-he/', '/en/contact/'],
    ['/dich-vu/', '/en/services/'],
    ['/don-gia/', '/en/pricing/'],
  ];
  for (const [vi, en] of simple) {
    if (p === vi || p === en) return target === 'vi' ? vi : en;
  }
  const typeOf = (slug: string) => site.projectTypes.find((t) => t.slug.vi === slug || t.slug.en === slug);
  const project = p.match(/^\/(?:du-an|en\/projects)\/([^/]+)\/([^/]+)\/$/);
  if (project) {
    const type = typeOf(project[1]);
    return type ? paths.project(target, type.slug[target], project[2]) : paths.projects(target);
  }
  const typePage = p.match(/^\/(?:du-an|en\/projects)\/([^/]+)\/$/);
  if (typePage) {
    const type = typeOf(typePage[1]);
    return type ? paths.projectType(target, type.slug[target]) : paths.projects(target);
  }
  const service = p.match(/^\/(?:dich-vu|en\/services)\/([^/]+)\/$/);
  if (service) {
    const item = site.services.items.find((s) => s.slug.vi === service[1] || s.slug.en === service[1]);
    return item ? paths.service(target, item.slug[target]) : paths.services(target);
  }
  return paths.home(target);
}

export function serviceByCategory(site: SiteContent, key: Category) {
  return site.services.items.find((s) => s.key === key);
}
