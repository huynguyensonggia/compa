import type { Lang, SiteContent, Category } from '../content/types';

/** Public URL structure (trailing slash everywhere). Vietnamese at the root, English under /en/. */
export const paths = {
  home: (l: Lang) => (l === 'vi' ? '/' : '/en/'),
  projects: (l: Lang) => (l === 'vi' ? '/du-an/' : '/en/projects/'),
  project: (l: Lang, slug: string) => (l === 'vi' ? `/du-an/${slug}/` : `/en/projects/${slug}/`),
  studio: (l: Lang) => (l === 'vi' ? '/gioi-thieu/' : '/en/studio/'),
  contact: (l: Lang) => (l === 'vi' ? '/lien-he/' : '/en/contact/'),
  services: (l: Lang) => (l === 'vi' ? '/dich-vu/' : '/en/services/'),
  service: (l: Lang, slug: string) => (l === 'vi' ? `/dich-vu/${slug}/` : `/en/services/${slug}/`),
};

export function langFromPath(pathname: string): Lang {
  return pathname === '/en' || pathname.startsWith('/en/') ? 'en' : 'vi';
}

const withSlash = (p: string) => (p.endsWith('/') ? p : p + '/');

/** Map the current URL to the equivalent page in the other language. */
export function translatePath(pathname: string, target: Lang, site: SiteContent): string {
  const p = withSlash(pathname);
  const simple: Array<[string, string]> = [
    ['/', '/en/'],
    ['/du-an/', '/en/projects/'],
    ['/gioi-thieu/', '/en/studio/'],
    ['/lien-he/', '/en/contact/'],
    ['/dich-vu/', '/en/services/'],
  ];
  for (const [vi, en] of simple) {
    if (p === vi || p === en) return target === 'vi' ? vi : en;
  }
  const project = p.match(/^\/(?:du-an|en\/projects)\/([^/]+)\/$/);
  if (project) return paths.project(target, project[1]);
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
