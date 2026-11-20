// Content shipped with the repository (content/*.json). The production build reads only this.
import siteJson from '../../content/site.json';
import assetsJson from '../../content/assets.json';
import redirectsJson from '../../content/redirects.json';
import type { AssetRecord, ContentState, ProjectFull, Redirect, SiteContent, AssetMap } from './types';
import { resolveAsset } from './resolve';

const projectModules = import.meta.glob('../../content/projects/*.json', { eager: true, import: 'default' });

export function getStaticRecords() {
  const site = structuredClone(siteJson) as unknown as SiteContent;
  const assets = structuredClone((assetsJson as unknown as { assets: AssetRecord[] }).assets);
  const projects = Object.values(projectModules).map((m) => {
    const p = structuredClone(m) as ProjectFull;
    if (p.publishedSlug === undefined) p.publishedSlug = p.status === 'published' ? p.slug : null;
    p.groups = p.groups.map((g) => ({ ...g, projectId: p.id }));
    p.images = p.images.map((i) => ({ ...i, projectId: p.id }));
    return p;
  });
  const redirects = structuredClone(redirectsJson) as Redirect[];
  return { site, assets, projects, redirects };
}

export function getStaticContent(): ContentState {
  const { site, assets, projects, redirects } = getStaticRecords();
  const map: AssetMap = {};
  for (const a of assets) map[a.id] = resolveAsset(a);
  return {
    site,
    // Drafts never ship in a production bundle.
    projects: import.meta.env.DEV ? projects : projects.filter((p) => p.status === 'published'),
    assets: map,
    redirects,
    source: 'static',
  };
}
