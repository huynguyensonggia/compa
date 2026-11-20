declare const __SITE_URL__: string;

/** Root domain from the SITE_URL env var (no trailing slash). Empty = relative URLs only. */
export const SITE_URL: string = typeof __SITE_URL__ === 'string' ? __SITE_URL__ : '';

export function absUrl(path: string): string {
  return SITE_URL ? SITE_URL + path : path;
}

export const OG_DEFAULT_PATH = '/og/default.jpg';
export const ogProjectPath = (slug: string) => `/og/${slug}.jpg`;
