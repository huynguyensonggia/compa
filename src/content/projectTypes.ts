import type { AssetMap, Lang, ProjectFull, ProjectType, ResolvedAsset, SiteContent } from './types';
import { byOrder, publishedProjects } from './resolve';
import { paths } from '../routing/paths';

export function sortedTypes(site: SiteContent): ProjectType[] {
  return [...(site.projectTypes ?? [])].sort(byOrder);
}

export function typeOfProject(site: SiteContent, p: Pick<ProjectFull, 'typeId'>): ProjectType | undefined {
  return site.projectTypes?.find((t) => t.id === p.typeId);
}

export function typeBySlug(site: SiteContent, lang: Lang, slug: string): ProjectType | undefined {
  return site.projectTypes?.find((t) => t.slug[lang] === slug);
}

/** Public URL of a project, or null when it has no (valid) type. */
export function projectPath(site: SiteContent, p: Pick<ProjectFull, 'typeId' | 'slug'>, lang: Lang): string | null {
  const type = typeOfProject(site, p);
  return type ? paths.project(lang, type.slug[lang], p.slug) : null;
}

export function projectPaths(site: SiteContent, p: Pick<ProjectFull, 'typeId' | 'slug'>): Record<Lang, string> | null {
  const vi = projectPath(site, p, 'vi');
  const en = projectPath(site, p, 'en');
  return vi && en ? { vi, en } : null;
}

/** Published projects that can be reached (have a valid type). */
export function publicProjects(site: SiteContent, projects: ProjectFull[]): ProjectFull[] {
  return publishedProjects(projects).filter((p) => typeOfProject(site, p));
}

export function projectsOfType(site: SiteContent, projects: ProjectFull[], typeId: string): ProjectFull[] {
  return publicProjects(site, projects).filter((p) => p.typeId === typeId);
}

/** Types shown publicly: only those with at least one published project. */
export function visibleTypes(site: SiteContent, projects: ProjectFull[]) {
  return sortedTypes(site)
    .map((type) => ({ type, projects: projectsOfType(site, projects, type.id) }))
    .filter((t) => t.projects.length > 0);
}

/** Card image for a type: its own cover, else the first project's cover. */
export function typeCover(type: ProjectType, projects: ProjectFull[], assets: AssetMap): ResolvedAsset | undefined {
  if (type.coverAssetId && assets[type.coverAssetId]) return assets[type.coverAssetId];
  const first = projects.find((p) => p.coverAssetId && assets[p.coverAssetId]);
  return first?.coverAssetId ? assets[first.coverAssetId] : undefined;
}
