/**
 * Turns an uploaded file into a small, transparent category icon stored inline (data URL) in site.json.
 * - SVG: kept as is (shown through <img>/CSS mask, so scripts inside never run).
 * - PNG / WebP / JPG: scaled to at most MAX px, optional background removal, transparent margins trimmed.
 *
 * Background removal is a flood fill from the image border: pixels connected to the edge whose colour is
 * close to the border colour become transparent, with a soft ramp near the threshold for smooth edges.
 * It suits icons on a plain (white or single-colour) background; photos are not a good fit.
 */

const MAX = 160;
const MAX_SVG_BYTES = 150_000;
const MAX_INPUT_BYTES = 8_000_000;

export interface IconOptions {
  removeBackground: boolean;
  /** 0–100: how far a colour may be from the background colour and still be removed. */
  tolerance?: number;
}

export async function iconFromFile(file: File, opts: IconOptions): Promise<string> {
  if (file.size > MAX_INPUT_BYTES) throw new Error('Ảnh quá lớn (tối đa 8 MB).');
  if (file.type === 'image/svg+xml' || file.name.toLowerCase().endsWith('.svg')) {
    if (file.size > MAX_SVG_BYTES) throw new Error('File SVG quá lớn (tối đa 150 KB).');
    const text = await file.text();
    if (!/<svg[\s>]/i.test(text)) throw new Error('File SVG không hợp lệ.');
    return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(text)}`;
  }
  if (!/^image\/(png|webp|jpeg|gif)$/.test(file.type)) throw new Error('Chỉ hỗ trợ PNG, WebP, JPG hoặc SVG.');

  const bitmap = await createImageBitmap(file);
  const scale = Math.min(1, MAX / Math.max(bitmap.width, bitmap.height));
  const w = Math.max(1, Math.round(bitmap.width * scale));
  const h = Math.max(1, Math.round(bitmap.height * scale));
  const canvas = document.createElement('canvas');
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext('2d', { willReadFrequently: true });
  if (!ctx) throw new Error('Trình duyệt không hỗ trợ xử lý ảnh.');
  ctx.imageSmoothingQuality = 'high';
  ctx.drawImage(bitmap, 0, 0, w, h);
  bitmap.close();

  const img = ctx.getImageData(0, 0, w, h);
  if (opts.removeBackground && !hasTransparentBorder(img)) removeBackground(img, opts.tolerance ?? 18);
  const trimmed = trim(img);
  if (!trimmed) throw new Error('Sau khi tách nền ảnh không còn nội dung — thử giảm độ nhạy hoặc tắt "Tự tách nền".');

  const out = document.createElement('canvas');
  out.width = trimmed.width;
  out.height = trimmed.height;
  out.getContext('2d')!.putImageData(trimmed, 0, 0);
  return out.toDataURL('image/png');
}

/** Already cut out (transparent edges)? Then leave it alone. */
function hasTransparentBorder({ data, width, height }: ImageData): boolean {
  let clear = 0;
  let total = 0;
  const check = (x: number, y: number) => {
    total++;
    if (data[(y * width + x) * 4 + 3] < 16) clear++;
  };
  for (let x = 0; x < width; x++) {
    check(x, 0);
    check(x, height - 1);
  }
  for (let y = 0; y < height; y++) {
    check(0, y);
    check(width - 1, y);
  }
  return clear / total > 0.6;
}

function removeBackground(img: ImageData, tolerance: number) {
  const { data, width, height } = img;
  // Background colour = median of the border pixels (robust to a few stray pixels).
  const rs: number[] = [];
  const gs: number[] = [];
  const bs: number[] = [];
  const sample = (x: number, y: number) => {
    const i = (y * width + x) * 4;
    rs.push(data[i]);
    gs.push(data[i + 1]);
    bs.push(data[i + 2]);
  };
  for (let x = 0; x < width; x++) {
    sample(x, 0);
    sample(x, height - 1);
  }
  for (let y = 1; y < height - 1; y++) {
    sample(0, y);
    sample(width - 1, y);
  }
  const med = (a: number[]) => a.sort((p, q) => p - q)[a.length >> 1];
  const br = med(rs);
  const bg = med(gs);
  const bb = med(bs);

  const hard = (tolerance / 100) * 441; // 441 ≈ max RGB distance
  const soft = hard * 1.8;
  const dist = (i: number) => Math.hypot(data[i] - br, data[i + 1] - bg, data[i + 2] - bb);

  const seen = new Uint8Array(width * height);
  const stack: number[] = [];
  const push = (x: number, y: number) => {
    const p = y * width + x;
    if (!seen[p]) {
      seen[p] = 1;
      stack.push(p);
    }
  };
  for (let x = 0; x < width; x++) {
    push(x, 0);
    push(x, height - 1);
  }
  for (let y = 0; y < height; y++) {
    push(0, y);
    push(width - 1, y);
  }
  while (stack.length) {
    const p = stack.pop()!;
    const i = p * 4;
    const d = dist(i);
    if (d > soft) continue; // part of the icon: stop here
    // fully transparent inside the hard threshold, fading alpha between hard and soft (anti-aliased edge)
    const keep = d <= hard ? 0 : (d - hard) / (soft - hard);
    data[i + 3] = Math.round(data[i + 3] * keep);
    if (d > hard) continue; // edge pixel: soften but do not spread further
    const x = p % width;
    const y = (p - x) / width;
    if (x > 0) push(x - 1, y);
    if (x < width - 1) push(x + 1, y);
    if (y > 0) push(x, y - 1);
    if (y < height - 1) push(x, y + 1);
  }
}

/** Crop away fully transparent margins. Returns null when nothing is left. */
function trim(img: ImageData): ImageData | null {
  const { data, width, height } = img;
  let x0 = width;
  let y0 = height;
  let x1 = -1;
  let y1 = -1;
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      if (data[(y * width + x) * 4 + 3] > 8) {
        if (x < x0) x0 = x;
        if (x > x1) x1 = x;
        if (y < y0) y0 = y;
        if (y > y1) y1 = y;
      }
    }
  }
  if (x1 < 0) return null;
  const w = x1 - x0 + 1;
  const h = y1 - y0 + 1;
  const out = new ImageData(w, h);
  for (let y = 0; y < h; y++) {
    const src = ((y + y0) * width + x0) * 4;
    out.data.set(data.subarray(src, src + w * 4), y * w * 4);
  }
  return out;
}
