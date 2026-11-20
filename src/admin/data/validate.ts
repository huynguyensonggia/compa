import type { ProjectFull, Lang, Bi } from '../../content/types';
import { SLUG_RE } from './slug';

export interface Issue {
  level: 'error' | 'warning';
  message: string;
}

/** Validation for saving a project. Errors block saving; warnings are shown only. */
export function validateProject(p: ProjectFull, others: ProjectFull[], intent: 'draft' | 'published'): Issue[] {
  const issues: Issue[] = [];
  const err = (message: string) => issues.push({ level: 'error', message });
  const warn = (message: string) => issues.push({ level: 'warning', message });

  if (!p.title.vi.trim()) err('Cần nhập tên dự án (tiếng Việt).');
  if (!SLUG_RE.test(p.slug)) err('Slug chỉ gồm chữ thường không dấu, số và dấu gạch ngang (ví dụ: nha-vuon-cam-thanh).');
  if (others.some((o) => o.id !== p.id && o.slug === p.slug)) err(`Slug "${p.slug}" đã được dùng cho dự án khác.`);
  if (p.year !== null && (!Number.isInteger(p.year) || p.year < 1950 || p.year > 2100)) err('Năm không hợp lệ.');

  const groupIds = new Set(p.groups.map((g) => g.id));
  const broken = p.images.filter((i) => i.groupId !== null && !groupIds.has(i.groupId));
  if (broken.length) err(`${broken.length} ảnh tham chiếu tới nhóm không tồn tại.`);
  const imageIds = new Set<string>();
  for (const img of p.images) {
    if (imageIds.has(img.id)) err(`Ảnh bị trùng ID: ${img.id}`);
    imageIds.add(img.id);
  }

  if (intent === 'published') {
    const unclassified = p.images.filter((i) => i.groupId === null).length;
    if (unclassified) {
      err(`Còn ${unclassified} ảnh trong "Chưa phân loại". Hãy chuyển các ảnh này vào một nhóm không gian (hoặc xóa khỏi gallery) trước khi công khai.`);
    }
    if (!p.coverAssetId) err('Cần chọn ảnh bìa trước khi công khai.');
    if (!p.images.length) err('Gallery chưa có ảnh.');
    if (!p.title.en.trim()) warn('Chưa có tên tiếng Anh — bản EN sẽ hiển thị tên tiếng Việt.');
    const missingAlt = p.images.filter((i) => !i.alt.vi.trim()).length;
    if (missingAlt) warn(`${missingAlt} ảnh chưa có mô tả (alt) tiếng Việt.`);
  }
  return issues;
}

/** Fields where exactly one language is filled in. */
export function missingTranslation(value: Bi): Lang | null {
  const vi = value.vi.trim();
  const en = value.en.trim();
  if (vi && !en) return 'en';
  if (en && !vi) return 'vi';
  return null;
}
