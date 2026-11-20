import type { AssetRecord, ResolvedAsset, ProjectFull, SpaceGroup, GalleryImage } from './types';

export const IMAGE_WIDTHS = [480, 960, 1600] as const;

/** Resolve a stored asset to URLs. Blob assets need an object URL created by the caller. */
export function resolveAsset(rec: AssetRecord, objectUrl?: string): ResolvedAsset {
  const base = {
    id: rec.id,
    width: rec.width,
    height: rec.height,
    sourceUrl: rec.sourceUrl,
    license: rec.license,
    isDemo: rec.isDemo,
  };
  if (rec.src) {
    const seen = new Set<number>();
    const parts: string[] = [];
    for (const w of IMAGE_WIDTHS) {
      const descriptor = Math.min(w, rec.width || w);
      if (seen.has(descriptor)) continue;
      seen.add(descriptor);
      parts.push(`/images/${rec.src}-${w}.webp ${descriptor}w`);
    }
    return { ...base, src: `/images/${rec.src}-960.webp`, srcSet: parts.join(', '), isBlob: false };
  }
  return { ...base, src: objectUrl ?? '', isBlob: true };
}

export const byOrder = <T extends { sortOrder: number; id: string }>(a: T, b: T) =>
  a.sortOrder - b.sortOrder || (a.id < b.id ? -1 : a.id > b.id ? 1 : 0);

export interface GallerySection {
  group: SpaceGroup;
  images: GalleryImage[];
}

/** Ordered, non-empty gallery sections (groups in saved order, images in saved order). */
export function gallerySections(project: ProjectFull): GallerySection[] {
  return [...project.groups]
    .sort(byOrder)
    .map((group) => ({
      group,
      images: project.images.filter((img) => img.groupId === group.id).sort(byOrder),
    }))
    .filter((s) => s.images.length > 0);
}

export function publishedProjects(projects: ProjectFull[]): ProjectFull[] {
  return projects.filter((p) => p.status === 'published').sort(byOrder);
}
