// Content repository backed by IndexedDB (local demo admin).
// All reads/writes go through here so it can later be swapped for an HTTP API.
import { getDb, STORES, type Meta } from './db';
import { getStaticRecords } from '../../content/static';
import { resolveAsset, byOrder } from '../../content/resolve';
import { CONTENT_CHANNEL, CONTENT_EVENT } from '../../content/ContentContext';
import type { AssetMap, AssetRecord, ContentState, Project, ProjectFull, Redirect, SiteContent } from '../../content/types';
import { validateProject } from './validate';
import { newId } from './slug';

export interface Records {
  site: SiteContent;
  projects: ProjectFull[];
  assets: AssetRecord[];
  redirects: Redirect[];
}

// ---------- object URLs (runtime only, never persisted) ----------
const objectUrls = new Map<string, string>();
function urlFor(rec: AssetRecord): string | undefined {
  if (!rec.blob) return undefined;
  let url = objectUrls.get(rec.id);
  if (!url) {
    url = URL.createObjectURL(rec.blob);
    objectUrls.set(rec.id, url);
  }
  return url;
}

export function resolveAssets(records: AssetRecord[]): AssetMap {
  const map: AssetMap = {};
  for (const r of records) map[r.id] = resolveAsset(r, urlFor(r));
  return map;
}

// ---------- seed ----------
export async function isSeeded(): Promise<boolean> {
  const db = await getDb();
  return !!(await db.get('kv', 'meta'));
}

/** Copy content/ into IndexedDB once. Never overwrites existing local edits. */
export async function ensureSeeded(): Promise<void> {
  if (await isSeeded()) return;
  await writeAll(getStaticRecords());
}

async function writeAll(r: Records, keepBlobs?: Map<string, AssetRecord>) {
  const db = await getDb();
  const tx = db.transaction([...STORES], 'readwrite');
  await Promise.all(STORES.map((s) => tx.objectStore(s).clear()));
  const kv = tx.objectStore('kv');
  await kv.put(r.site, 'site');
  for (const p of r.projects) {
    const { groups, images, ...project } = p;
    await tx.objectStore('projects').put(project);
    for (const g of groups) await tx.objectStore('groups').put({ ...g, projectId: p.id });
    for (const i of images) await tx.objectStore('images').put({ ...i, projectId: p.id });
  }
  for (const a of r.assets) {
    const blob = keepBlobs?.get(a.id)?.blob;
    await tx.objectStore('assets').put(blob && !a.blob ? { ...a, blob } : a);
  }
  for (const rd of r.redirects) await tx.objectStore('redirects').put(rd);
  const meta: Meta = { seededAt: new Date().toISOString(), schema: 1 };
  await kv.put(meta, 'meta');
  await tx.done;
}

// ---------- read ----------
export async function loadRecords(): Promise<Records> {
  await ensureSeeded();
  const db = await getDb();
  const tx = db.transaction(['kv', 'projects', 'groups', 'images', 'assets', 'redirects']);
  const [site, projects, groups, images, assets, redirects] = await Promise.all([
    tx.objectStore('kv').get('site') as Promise<SiteContent>,
    tx.objectStore('projects').getAll(),
    tx.objectStore('groups').getAll(),
    tx.objectStore('images').getAll(),
    tx.objectStore('assets').getAll(),
    tx.objectStore('redirects').getAll(),
  ]);
  await tx.done;
  const full: ProjectFull[] = projects.sort(byOrder).map((p) => ({
    ...p,
    groups: groups.filter((g) => g.projectId === p.id).sort(byOrder),
    images: images.filter((i) => i.projectId === p.id).sort(byOrder),
  }));
  return { site, projects: full, assets, redirects };
}

/** Public site in local mode: IndexedDB if the admin has been used here, otherwise null (→ content/). */
export async function loadLocalContent(): Promise<ContentState | null> {
  try {
    if (!(await isSeeded())) return null;
    const r = await loadRecords();
    return { site: r.site, projects: r.projects, assets: resolveAssets(r.assets), redirects: r.redirects, source: 'local' };
  } catch {
    return null;
  }
}

export function notifyChange() {
  window.dispatchEvent(new Event(CONTENT_EVENT));
  if ('BroadcastChannel' in window) {
    const bc = new BroadcastChannel(CONTENT_CHANNEL);
    bc.postMessage('changed');
    bc.close();
  }
}

// ---------- write: projects ----------
export class ValidationError extends Error {
  constructor(public issues: string[]) {
    super(issues.join('\n'));
  }
}

/**
 * Save a project with its groups and gallery in ONE transaction.
 * Creates a 301 redirect when a published project's slug changes.
 */
export async function saveProject(input: ProjectFull): Promise<ProjectFull> {
  const db = await getDb();
  const all = (await loadRecords()).projects;
  const errors = validateProject(input, all, input.status).filter((i) => i.level === 'error');
  if (errors.length) throw new ValidationError(errors.map((e) => e.message));

  const now = new Date().toISOString();
  const project: ProjectFull = { ...input, updatedAt: now };
  const tx = db.transaction(['projects', 'groups', 'images', 'redirects'], 'readwrite');
  const redirects = tx.objectStore('redirects');

  if (project.status === 'published') {
    const old = project.publishedSlug;
    if (old && old !== project.slug) {
      // Point earlier redirects straight at the new slug (no chains) and add old → new.
      for (const r of await redirects.getAll()) {
        if (r.to === old) await redirects.put({ ...r, to: project.slug });
      }
      await redirects.put({ from: old, to: project.slug, createdAt: now });
    }
    await redirects.delete(project.slug); // the slug is live again
    project.publishedSlug = project.slug;
  }

  const { groups, images, ...base } = project;
  const groupIds = new Set(groups.map((g) => g.id));
  for (const img of images) {
    if (img.groupId !== null && !groupIds.has(img.groupId)) {
      tx.abort();
      throw new ValidationError([`Ảnh ${img.id} tham chiếu nhóm không thuộc dự án.`]);
    }
  }
  await tx.objectStore('projects').put(base as Project);
  const gStore = tx.objectStore('groups');
  const iStore = tx.objectStore('images');
  for (const key of await gStore.index('projectId').getAllKeys(project.id)) {
    if (!groupIds.has(key)) await gStore.delete(key);
  }
  const imageIds = new Set(images.map((i) => i.id));
  for (const key of await iStore.index('projectId').getAllKeys(project.id)) {
    if (!imageIds.has(key)) await iStore.delete(key);
  }
  for (const g of groups) await gStore.put({ ...g, projectId: project.id });
  for (const i of images) await iStore.put({ ...i, projectId: project.id });
  await tx.done;
  notifyChange();
  return project;
}

export async function deleteProject(id: string): Promise<void> {
  const db = await getDb();
  const tx = db.transaction(['projects', 'groups', 'images', 'redirects'], 'readwrite');
  const project = await tx.objectStore('projects').get(id);
  await tx.objectStore('projects').delete(id);
  for (const k of await tx.objectStore('groups').index('projectId').getAllKeys(id)) await tx.objectStore('groups').delete(k);
  for (const k of await tx.objectStore('images').index('projectId').getAllKeys(id)) await tx.objectStore('images').delete(k);
  if (project) {
    for (const r of await tx.objectStore('redirects').getAll()) {
      if (r.to === project.slug) await tx.objectStore('redirects').delete(r.from);
    }
  }
  await tx.done;
  await collectUnusedBlobs();
  notifyChange();
}

export async function reorderProjects(orderedIds: string[]): Promise<void> {
  const db = await getDb();
  const tx = db.transaction('projects', 'readwrite');
  for (let i = 0; i < orderedIds.length; i++) {
    const p = await tx.store.get(orderedIds[i]);
    if (p) await tx.store.put({ ...p, sortOrder: i });
  }
  await tx.done;
  notifyChange();
}

// ---------- write: site ----------
export async function saveSite(site: SiteContent): Promise<void> {
  const db = await getDb();
  await db.put('kv', { ...site, updatedAt: new Date().toISOString() }, 'site');
  notifyChange();
}

// ---------- assets ----------
async function readDimensions(file: File): Promise<{ width: number; height: number }> {
  const bitmap = await createImageBitmap(file);
  const dims = { width: bitmap.width, height: bitmap.height };
  bitmap.close();
  return dims;
}

/**
 * Store picked files as Blob assets. Results keep the order of `files` (the picker order),
 * independent of which file finishes first. Unreadable files are reported, not silently dropped.
 */
export async function addAssetsFromFiles(files: File[]): Promise<{ assets: AssetRecord[]; failed: string[] }> {
  const results = await Promise.all(
    files.map(async (file) => {
      try {
        if (!file.type.startsWith('image/')) throw new Error('not image');
        const dims = await readDimensions(file);
        const rec: AssetRecord = {
          id: newId('as'),
          ...dims,
          blob: file,
          mime: file.type,
          fileName: file.name,
          createdAt: new Date().toISOString(),
        };
        return rec;
      } catch {
        return file.name;
      }
    }),
  );
  const assets = results.filter((r): r is AssetRecord => typeof r !== 'string');
  const failed = results.filter((r): r is string => typeof r === 'string');
  const db = await getDb();
  const tx = db.transaction('assets', 'readwrite');
  for (const a of assets) await tx.store.put(a);
  await tx.done;
  return { assets, failed };
}

export function referencedAssetIds(r: Pick<Records, 'site' | 'projects'>): Set<string> {
  const ids = new Set<string>();
  const add = (id: string | null | undefined) => id && ids.add(id);
  add(r.site.brand.logoAssetId);
  add(r.site.pages.studio.imageAssetId);
  add(r.site.seo.defaultOgAssetId);
  r.site.hero.slides.forEach((s) => add(s.assetId));
  for (const p of r.projects) {
    add(p.coverAssetId);
    add(p.seo.ogAssetId);
    p.images.forEach((i) => add(i.assetId));
  }
  return ids;
}

/** Remove uploaded blobs that nothing references any more (static repo images are kept). */
export async function collectUnusedBlobs(): Promise<number> {
  const r = await loadRecords();
  const used = referencedAssetIds(r);
  const db = await getDb();
  const tx = db.transaction('assets', 'readwrite');
  let removed = 0;
  for (const a of r.assets) {
    if (a.blob && !used.has(a.id)) {
      await tx.store.delete(a.id);
      const url = objectUrls.get(a.id);
      if (url) URL.revokeObjectURL(url);
      objectUrls.delete(a.id);
      removed++;
    }
  }
  await tx.done;
  return removed;
}

// ---------- reset / backup ----------
export async function resetDemo(): Promise<void> {
  await writeAll(getStaticRecords());
  for (const url of objectUrls.values()) URL.revokeObjectURL(url);
  objectUrls.clear();
  notifyChange();
}

export const BACKUP_FORMAT = 'compa-content-backup';

/**
 * JSON backup of all content. Images are REFERENCES only (asset metadata, no image bytes),
 * so this is not a full backup of uploaded photos.
 */
export async function exportBackup() {
  const r = await loadRecords();
  return {
    format: BACKUP_FORMAT,
    version: 1,
    exportedAt: new Date().toISOString(),
    note: 'Chỉ chứa nội dung và tham chiếu ảnh (assetId), KHÔNG chứa dữ liệu ảnh. Ảnh tải lên chỉ khôi phục được trên cùng trình duyệt/thiết bị.',
    site: r.site,
    projects: r.projects,
    assets: r.assets.map(({ blob: _blob, ...meta }) => ({ ...meta, hasLocalBlob: !!_blob })),
    redirects: r.redirects,
  };
}

/** Validate a backup before import. Returns a list of problems (empty = OK). */
export async function checkBackup(data: unknown): Promise<string[]> {
  const problems: string[] = [];
  const d = data as Partial<Awaited<ReturnType<typeof exportBackup>>>;
  if (!d || d.format !== BACKUP_FORMAT) return ['Tệp không phải bản sao lưu nội dung COMPA.'];
  if (!d.site || !Array.isArray(d.projects) || !Array.isArray(d.assets) || !Array.isArray(d.redirects)) {
    return ['Thiếu phần dữ liệu bắt buộc (site, projects, assets, redirects).'];
  }
  const current = new Map((await loadRecords()).assets.map((a) => [a.id, a]));
  const assetIds = new Set(d.assets.map((a) => a.id));
  const usable = (id: string) => {
    const meta = d.assets!.find((a) => a.id === id);
    if (!meta) return false;
    return !!meta.src || !!current.get(id)?.blob;
  };
  const slugs = new Set<string>();
  for (const p of d.projects) {
    if (slugs.has(p.slug)) problems.push(`Slug trùng: ${p.slug}`);
    slugs.add(p.slug);
    const gids = new Set(p.groups.map((g) => g.id));
    for (const img of p.images) {
      if (img.groupId !== null && !gids.has(img.groupId)) problems.push(`${p.slug}: ảnh ${img.id} tham chiếu nhóm không tồn tại (${img.groupId}).`);
      if (!assetIds.has(img.assetId)) problems.push(`${p.slug}: ảnh ${img.id} tham chiếu asset không có trong tệp (${img.assetId}).`);
      else if (!usable(img.assetId)) problems.push(`${p.slug}: ảnh ${img.id} là ảnh tải lên ở trình duyệt khác, không có dữ liệu ảnh tại đây.`);
    }
    if (p.status === 'published' && p.images.some((i) => i.groupId === null)) problems.push(`${p.slug}: dự án công khai còn ảnh chưa phân loại.`);
  }
  for (const s of d.site.hero?.slides ?? []) if (!assetIds.has(s.assetId)) problems.push(`Ảnh mở đầu ${s.id} tham chiếu asset không tồn tại.`);
  return problems;
}

export async function importBackup(data: unknown): Promise<void> {
  const problems = await checkBackup(data);
  if (problems.length) throw new ValidationError(problems);
  const d = data as Awaited<ReturnType<typeof exportBackup>>;
  const current = new Map((await loadRecords()).assets.map((a) => [a.id, a]));
  await writeAll(
    {
      site: d.site,
      projects: d.projects,
      assets: d.assets.map(({ hasLocalBlob: _h, ...a }) => a),
      redirects: d.redirects,
    },
    current,
  );
  notifyChange();
}
