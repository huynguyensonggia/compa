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
