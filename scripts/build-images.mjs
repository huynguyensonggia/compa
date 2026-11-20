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

// Favicons: from the client's original logo when provided, otherwise from the temporary wordmark icon.
const logoPng = path.join(ROOT, 'public', 'brand', 'logo.png');
const iconSource = fs.existsSync(logoPng) ? logoPng : path.join(ROOT, 'public', 'favicon.svg');
await sharp(iconSource).resize(32, 32, { fit: 'contain', background: '#525350' }).png().toFile(path.join(ROOT, 'public', 'favicon-32.png'));
await sharp(iconSource).resize(180, 180, { fit: 'contain', background: '#525350' }).png().toFile(path.join(ROOT, 'public', 'apple-touch-icon.png'));

console.log(`images: ${assets.length} assets ready (${WIDTHS.join('/')}px WebP)`);
