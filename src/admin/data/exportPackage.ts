// "Xuất gói nội dung cho website": a ZIP with validated JSON + uploaded images renamed by
// slug / group / order. Imported into the repo with `npm run content:import <file.zip>`.
import { zipSync, strToU8 } from 'fflate';
import { loadRecords } from './repository';
import { slugify } from './slug';
import { gallerySections } from '../../content/resolve';
import { validateProject } from './validate';
import type { AssetRecord } from '../../content/types';

export const PACKAGE_FORMAT = 'compa-content-package';

const extFor = (a: AssetRecord) => {
  const fromName = a.fileName?.split('.').pop()?.toLowerCase();
  if (fromName && ['jpg', 'jpeg', 'png', 'webp', 'avif'].includes(fromName)) return fromName === 'jpeg' ? 'jpg' : fromName;
  if (a.mime === 'image/png') return 'png';
  if (a.mime === 'image/webp') return 'webp';
  return 'jpg';
};

export async function buildContentPackage(): Promise<{ blob: Blob; warnings: string[] }> {
  const r = await loadRecords();
  const warnings: string[] = [];
  for (const p of r.projects) {
    for (const issue of validateProject(p, r.projects, p.status, r.site)) {
      if (issue.level === 'error') throw new Error(`${p.slug}: ${issue.message}`);
      warnings.push(`${p.slug}: ${issue.message}`);
    }
  }

  // Meaningful, unaccented paths for every uploaded image, decided by first usage.
  const target = new Map<string, string>();
  const name = (assetId: string | null | undefined, path: string) => {
    if (assetId && !target.has(assetId)) target.set(assetId, path);
  };
  const pad = (n: number) => String(n).padStart(2, '0');
  for (const p of r.projects) {
    for (const s of gallerySections(p)) {
      const g = slugify(s.group.title.vi) || 'nhom';
      s.images.forEach((img, i) => name(img.assetId, `du-an/${p.slug}/${g}-${pad(i + 1)}`));
    }
    p.images.filter((i) => i.groupId === null).forEach((img, i) => name(img.assetId, `du-an/${p.slug}/chua-phan-loai-${pad(i + 1)}`));
    name(p.coverAssetId, `du-an/${p.slug}/anh-bia`);
    name(p.seo.ogAssetId, `du-an/${p.slug}/anh-chia-se`);
  }
  r.site.projectTypes.forEach((t) => name(t.coverAssetId, `danh-muc/${t.slug.vi}`));
  r.site.hero.slides.forEach((s, i) => name(s.assetId, `trang-chu/anh-mo-dau-${pad(i + 1)}`));
  name(r.site.pages.studio.imageAssetId, 'gioi-thieu/anh-01');
  name(r.site.brand.logoAssetId, 'thuong-hieu/logo');

  const files: Record<string, Uint8Array> = {};
  const assets: AssetRecord[] = [];
  for (const a of r.assets) {
    if (a.blob) {
      const dest = target.get(a.id);
      if (!dest) continue; // unused upload
      const ext = extFor(a);
      files[`images-src/${dest}.${ext}`] = new Uint8Array(await a.blob.arrayBuffer());
      assets.push({ id: a.id, src: dest, ext, width: a.width, height: a.height, alt: a.alt, isDemo: false });
    } else {
      const { blob: _b, ...meta } = a;
      assets.push(meta);
    }
  }

  const json = (v: unknown) => strToU8(JSON.stringify(v, null, 2) + '\n');
  files['manifest.json'] = json({ format: PACKAGE_FORMAT, version: 1, exportedAt: new Date().toISOString() });
  files['content/site.json'] = json(r.site);
  files['content/assets.json'] = json({ assets });
  files['content/redirects.json'] = json(r.redirects);
  for (const p of r.projects) {
    const { groups, images, ...base } = p;
    files[`content/projects/${p.slug}.json`] = json({
      ...base,
      groups: groups.map(({ projectId: _p, ...g }) => g),
      images: images.map(({ projectId: _p, ...i }) => i),
    });
  }
  const zipped = zipSync(files, { level: 0 });
  return { blob: new Blob([zipped], { type: 'application/zip' }), warnings };
}

export function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.append(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 2000);
}
