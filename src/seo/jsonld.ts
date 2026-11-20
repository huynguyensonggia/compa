import type { Lang, ProjectFull, ProjectType, SiteContent } from '../content/types';
import { absUrl, OG_DEFAULT_PATH, SITE_URL } from './config';
import { paths } from '../routing/paths';
import { translate } from '../i18n';

export const businessId = () => (SITE_URL ? `${SITE_URL}/#business` : '#business');

/** Single source for the business entity — same config as footer and contact page (NAP). */
export function businessJsonLd(site: SiteContent): Record<string, unknown> {
  const c = site.contact;
  const node: Record<string, unknown> = {
    '@context': 'https://schema.org',
    '@type': ['HomeAndConstructionBusiness', 'ProfessionalService'],
    '@id': businessId(),
    name: site.brand.name,
    url: absUrl('/'),
    logo: absUrl(site.brand.logoFile ? '/brand/logo.png' : '/apple-touch-icon.png'),
    image: absUrl(OG_DEFAULT_PATH),
    description: site.brand.description.vi,
    slogan: site.brand.tagline.vi,
    telephone: c.phoneE164,
    email: c.email,
    address: {
      '@type': 'PostalAddress',
      streetAddress: c.address.streetAddress,
      addressLocality: c.address.addressLocality,
      addressRegion: c.address.addressRegion,
      addressCountry: c.address.addressCountry,
    },
    areaServed: c.areaServed.map((name) => ({ '@type': 'City', name })),
    sameAs: [c.facebook, c.instagram, c.tiktok].filter(Boolean),
  };
  // Only verified optional fields; empty fields are omitted entirely.
  if (c.geo && Number.isFinite(c.geo.lat) && Number.isFinite(c.geo.lng)) {
    node.geo = { '@type': 'GeoCoordinates', latitude: c.geo.lat, longitude: c.geo.lng };
  }
  if (c.openingHours.length) node.openingHours = c.openingHours;
  if (c.googleMapsPlaceUrl) node.hasMap = c.googleMapsPlaceUrl;
  return node;
}

export function breadcrumbJsonLd(items: Array<{ name: string; path: string }>) {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((it, i) => ({
      '@type': 'ListItem',
      position: i + 1,
      name: it.name,
      item: absUrl(it.path),
    })),
  };
}

export function projectJsonLd(p: ProjectFull, type: ProjectType, lang: Lang, description: string, imagePath: string) {
  const url = paths.project(lang, type.slug[lang], p.slug);
  const node: Record<string, unknown> = {
    '@context': 'https://schema.org',
    '@type': 'CreativeWork',
    name: p.title[lang] || p.title.vi,
    description,
    url: absUrl(url),
    image: absUrl(imagePath),
    inLanguage: lang,
  };
  // Sample projects are never attributed to the business.
  if (!p.isDemo) node.creator = { '@id': businessId() };
  const loc = p.location[lang] || p.location.vi;
  if (loc) node.locationCreated = { '@type': 'Place', name: loc };
  if (p.year) node.dateCreated = String(p.year);
  return [
    breadcrumbJsonLd([
      { name: translate(lang, 'projects.title'), path: paths.projects(lang) },
      { name: type.title[lang] || type.title.vi, path: paths.projectType(lang, type.slug[lang]) },
      { name: p.title[lang] || p.title.vi, path: url },
    ]),
    node,
  ];
}
