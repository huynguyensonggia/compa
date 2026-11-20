// Shared image helpers for build scripts (Node only).
import fs from 'node:fs';
import path from 'node:path';
import sharp from 'sharp';

export const ROOT = process.cwd();
export const SRC_DIR = path.join(ROOT, 'content', 'images-src');
export const OUT_DIR = path.join(ROOT, 'public', 'images');
export const WIDTHS = [480, 960, 1600];
// Quality per width keeps thumbnails < ~150 KB and large images < ~400 KB.
const QUALITY = { 480: 72, 960: 70, 1600: 68 };

export function readJson(file) {
  return JSON.parse(fs.readFileSync(file, 'utf8'));
}

function isFresh(srcFile, outFile) {
  if (!fs.existsSync(outFile)) return false;
  return fs.statSync(outFile).mtimeMs >= fs.statSync(srcFile).mtimeMs;
}

/** Build WebP variants for one asset. Returns { width, height } of the original. */
export async function buildAssetVariants(asset, { force = false } = {}) {
  const srcFile = path.join(SRC_DIR, `${asset.src}.${asset.ext}`);
  if (!fs.existsSync(srcFile)) throw new Error(`Thiếu ảnh gốc: ${path.relative(ROOT, srcFile)}`);
  const meta = await sharp(srcFile).rotate().metadata();
  for (const w of WIDTHS) {
    const outFile = path.join(OUT_DIR, `${asset.src}-${w}.webp`);
    if (!force && isFresh(srcFile, outFile)) continue;
    fs.mkdirSync(path.dirname(outFile), { recursive: true });
    await sharp(srcFile)
      .rotate()
      .resize({ width: w, withoutEnlargement: true })
      .webp({ quality: QUALITY[w], effort: 5 })
      .toFile(outFile);
  }
  const portrait = (meta.orientation ?? 1) >= 5;
  return { width: portrait ? meta.height : meta.width, height: portrait ? meta.width : meta.height };
}

/** 1200×630 Open Graph JPEG cropped around an optional focal point (0..1). */
export async function buildOgImage(asset, outRel, focalPoint) {
  const srcFile = path.join(SRC_DIR, `${asset.src}.${asset.ext}`);
  const outFile = path.join(ROOT, 'dist', outRel);
  fs.mkdirSync(path.dirname(outFile), { recursive: true });
  const img = sharp(srcFile).rotate();
  const { width, height } = await img.metadata();
  const targetRatio = 1200 / 630;
  let cw = width, ch = Math.round(width / targetRatio);
  if (ch > height) { ch = height; cw = Math.round(height * targetRatio); }
  const fx = focalPoint?.x ?? 0.5, fy = focalPoint?.y ?? 0.5;
  const left = Math.min(Math.max(Math.round(fx * width - cw / 2), 0), width - cw);
  const top = Math.min(Math.max(Math.round(fy * height - ch / 2), 0), height - ch);
  await img.extract({ left, top, width: cw, height: ch }).resize(1200, 630).jpeg({ quality: 80, mozjpeg: true }).toFile(outFile);
}
