// Import a content package exported from /admin ("Xuất gói nội dung cho website").
// Usage: npm run content:import -- path/to/compa-goi-noi-dung-YYYY-MM-DD.zip
// Writes content/*.json, copies uploaded originals into content/images-src/, regenerates WebP variants.
import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { unzipSync, strFromU8 } from 'fflate';

const ROOT = process.cwd();
const zipPath = process.argv[2];
if (!zipPath || !fs.existsSync(zipPath)) {
  console.error('Cách dùng: npm run content:import -- <file.zip>');
  process.exit(1);
}

const files = unzipSync(new Uint8Array(fs.readFileSync(zipPath)));
const json = (name) => {
  if (!files[name]) throw new Error(`Gói thiếu tệp ${name}`);
  return JSON.parse(strFromU8(files[name]));
};

// ---- validate ----
const manifest = json('manifest.json');
if (manifest.format !== 'compa-content-package') throw new Error('Không phải gói nội dung COMPA.');
const site = json('content/site.json');
const { assets } = json('content/assets.json');
const redirects = json('content/redirects.json');
const projectFiles = Object.keys(files).filter((n) => /^content\/projects\/[a-z0-9-]+\.json$/.test(n));
const projects = projectFiles.map((n) => json(n));

const problems = [];
const assetIds = new Set(assets.map((a) => a.id));
const slugs = new Set();
const safe = (p) => !p.includes('..') && !path.isAbsolute(p);
for (const a of assets) {
  if (!a.src || !safe(a.src)) problems.push(`Asset ${a.id}: đường dẫn không hợp lệ`);
  const inZip = files[`images-src/${a.src}.${a.ext}`];
  const onDisk = fs.existsSync(path.join(ROOT, 'content', 'images-src', `${a.src}.${a.ext}`));
  if (!inZip && !onDisk) problems.push(`Asset ${a.id}: thiếu ảnh gốc ${a.src}.${a.ext}`);
}
for (const p of projects) {
  if (slugs.has(p.slug)) problems.push(`Slug trùng: ${p.slug}`);
  slugs.add(p.slug);
  const gids = new Set(p.groups.map((g) => g.id));
  for (const i of p.images) {
    if (i.groupId !== null && !gids.has(i.groupId)) problems.push(`${p.slug}: ảnh ${i.id} tham chiếu nhóm không tồn tại`);
    if (!assetIds.has(i.assetId)) problems.push(`${p.slug}: ảnh ${i.id} tham chiếu asset không tồn tại`);
  }
  if (p.status === 'published' && p.images.some((i) => i.groupId === null)) problems.push(`${p.slug}: dự án công khai còn ảnh chưa phân loại`);
  if (p.typeId && !(site.projectTypes ?? []).some((t) => t.id === p.typeId)) problems.push(`${p.slug}: danh mục không tồn tại (${p.typeId})`);
  if (p.status === 'published' && !p.typeId) problems.push(`${p.slug}: dự án công khai chưa có danh mục`);
  if (p.coverAssetId && !assetIds.has(p.coverAssetId)) problems.push(`${p.slug}: ảnh bìa không tồn tại`);
}
for (const s of site.hero.slides) if (!assetIds.has(s.assetId)) problems.push(`Ảnh mở đầu ${s.id}: asset không tồn tại`);
if (problems.length) {
  console.error('Gói nội dung có lỗi, chưa nhập:\n- ' + problems.join('\n- '));
  process.exit(1);
}

// ---- write ----
const contentDir = path.join(ROOT, 'content');
for (const [name, data] of Object.entries(files)) {
  if (name.startsWith('images-src/') && !name.endsWith('/')) {
    const rel = name.slice('images-src/'.length);
    if (!safe(rel)) continue;
    const dest = path.join(contentDir, 'images-src', rel);
    fs.mkdirSync(path.dirname(dest), { recursive: true });
    fs.writeFileSync(dest, data);
  }
}
fs.writeFileSync(path.join(contentDir, 'site.json'), JSON.stringify(site, null, 2) + '\n');
fs.writeFileSync(path.join(contentDir, 'assets.json'), JSON.stringify({ assets }, null, 2) + '\n');
fs.writeFileSync(path.join(contentDir, 'redirects.json'), JSON.stringify(redirects, null, 2) + '\n');
fs.rmSync(path.join(contentDir, 'projects'), { recursive: true, force: true });
fs.mkdirSync(path.join(contentDir, 'projects'), { recursive: true });
for (const p of projects) fs.writeFileSync(path.join(contentDir, 'projects', `${p.slug}.json`), JSON.stringify(p, null, 2) + '\n');

console.log(`Đã nhập: ${projects.length} dự án, ${assets.length} ảnh, ${redirects.length} chuyển hướng.`);
execFileSync(process.execPath, [path.join(ROOT, 'scripts', 'build-images.mjs')], { stdio: 'inherit' });
console.log('Xong. Chạy "npm run build" để tạo bản website mới.');
