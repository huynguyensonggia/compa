// Generates responsive WebP variants (480/960/1600) for every asset in content/assets.json,
// removes stale generated files and builds favicon PNGs.
// Usage: npm run images  (add --force to regenerate everything)
import fs from 'node:fs';
import path from 'node:path';
import sharp from 'sharp';
import { ROOT, OUT_DIR, WIDTHS, readJson, buildAssetVariants } from './lib/images.mjs';

const force = process.argv.includes('--force');
const { assets } = readJson(path.join(ROOT, 'content', 'assets.json'));

let changed = false;
for (const asset of assets) {
  const dims = await buildAssetVariants(asset, { force });
  if (dims.width !== asset.width || dims.height !== asset.height) {
    asset.width = dims.width;
    asset.height = dims.height;
    changed = true;
  }
}
if (changed) {
  fs.writeFileSync(path.join(ROOT, 'content', 'assets.json'), JSON.stringify({ assets }, null, 2) + '\n');
}

// Remove generated variants that no longer belong to an asset.
const expected = new Set(assets.flatMap((a) => WIDTHS.map((w) => path.normalize(path.join(OUT_DIR, `${a.src}-${w}.webp`)))));
function sweep(dir) {
  if (!fs.existsSync(dir)) return;
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      sweep(full);
      if (fs.readdirSync(full).length === 0) fs.rmdirSync(full);
    } else if (entry.name.endsWith('.webp') && !expected.has(path.normalize(full))) {
      fs.unlinkSync(full);
    }
  }
}
sweep(OUT_DIR);

// Brand logo: original square file supplied by the client (charcoal background, kept as-is — no recolouring).
const brandSrc = path.join(ROOT, 'content', 'images-src', 'brand', 'logo-original.jpg');
const brandOut = path.join(ROOT, 'public', 'brand');
if (fs.existsSync(brandSrc)) {
  fs.mkdirSync(brandOut, { recursive: true });
  // Displayed at 112–208 CSS px → 640 px covers 3× screens.
  await sharp(brandSrc).resize(640, 640).webp({ quality: 88, effort: 5 }).toFile(path.join(brandOut, 'logo.webp'));
  // PNG for JSON-LD "logo" and other consumers.
  await sharp(brandSrc).resize(512, 512).png({ compressionLevel: 9 }).toFile(path.join(brandOut, 'logo.png'));
  // Transparent version for the home hero: key out the flat charcoal background of the original
  // (alpha unmixing per pixel, so anti-aliased edges stay smooth and the sand colour is kept as-is).
  // A client-supplied transparent file at content/images-src/brand/logo-transparent.png takes precedence.
  const suppliedTransparent = path.join(ROOT, 'content', 'images-src', 'brand', 'logo-transparent.png');
  let keyed;
  if (fs.existsSync(suppliedTransparent)) {
    keyed = await sharp(suppliedTransparent).ensureAlpha().trim().png().toBuffer();
  } else {
    const { data, info } = await sharp(brandSrc).removeAlpha().raw().toBuffer({ resolveWithObject: true });
    const bg = [data[0], data[1], data[2]]; // corner pixel = flat background
    const fg = [206, 192, 157]; // logo sand, sampled from the file
    const out = Buffer.alloc(info.width * info.height * 4);
    for (let i = 0, o = 0; i < data.length; i += 3, o += 4) {
      let a = 0;
      for (let c = 0; c < 3; c++) a += (data[i + c] - bg[c]) / (fg[c] - bg[c]);
      a = Math.min(1, Math.max(0, a / 3));
      for (let c = 0; c < 3; c++) {
        out[o + c] = a > 0.02 ? Math.min(255, Math.max(0, Math.round((data[i + c] - (1 - a) * bg[c]) / a))) : fg[c];
      }
      out[o + 3] = a < 0.04 ? 0 : Math.round(a * 255);
    }
    keyed = await sharp(out, { raw: { width: info.width, height: info.height, channels: 4 } }).trim().png().toBuffer();
  }
  // Fixed 960×304 canvas so the page can reserve the exact box (no layout shift); sharp up to ~2.5× at 380px.
  const fitted = await sharp(keyed).resize(960, 304, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } }).png().toBuffer();
  await sharp(fitted).webp({ quality: 86, alphaQuality: 90, effort: 6 }).toFile(path.join(brandOut, 'logo-transparent.webp'));
  await sharp(fitted).png({ compressionLevel: 9 }).toFile(path.join(brandOut, 'logo-transparent.png'));

  // Favicons: a crop of the original "O + compass" mark (scaled down, not redrawn).
  // Crop box is in the 2048×2048 source; scaled if the source size differs.
  const { width = 2048 } = await sharp(brandSrc).metadata();
  const k = width / 2048;
  const mark = sharp(brandSrc).extract({ left: Math.round(484 * k), top: Math.round(757 * k), width: Math.round(420 * k), height: Math.round(420 * k) });
  await mark.clone().resize(32, 32).png().toFile(path.join(ROOT, 'public', 'favicon-32.png'));
  await mark.clone().resize(180, 180).png().toFile(path.join(ROOT, 'public', 'apple-touch-icon.png'));
} else {
  // No logo file: plain charcoal placeholder icon.
  const svg = Buffer.from('<svg xmlns="http://www.w3.org/2000/svg" width="64" height="64"><rect width="64" height="64" fill="#535351"/></svg>');
  await sharp(svg).resize(32, 32).png().toFile(path.join(ROOT, 'public', 'favicon-32.png'));
  await sharp(svg).resize(180, 180).png().toFile(path.join(ROOT, 'public', 'apple-touch-icon.png'));
}

console.log(`images: ${assets.length} assets ready (${WIDTHS.join('/')}px WebP)`);
