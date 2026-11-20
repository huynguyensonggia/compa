import type { Bi } from '../../content/types';
import type { Records } from '../data/repository';
import { missingTranslation } from '../data/validate';

export interface MissingItem {
  where: string;
  field: string;
  lang: 'vi' | 'en';
  link: string;
}

/** Every bilingual field where exactly one language is filled in. */
export function listMissingTranslations(r: Records): MissingItem[] {
  const out: MissingItem[] = [];
  const check = (where: string, field: string, v: Bi | undefined, link: string) => {
    if (!v) return;
    const m = missingTranslation(v);
    if (m) out.push({ where, field, lang: m, link });
  };
  const s = r.site;
  check('Thương hiệu', 'Thông điệp', s.brand.tagline, '/admin/thuong-hieu');
  check('Thương hiệu', 'Mô tả', s.brand.description, '/admin/thuong-hieu');
  check('Thương hiệu', 'Địa chỉ hiển thị', s.contact.address.display, '/admin/thuong-hieu');
  check('SEO', 'Tiêu đề trang chủ', s.seo.homeTitle, '/admin/thuong-hieu');
  check('SEO', 'Mô tả mặc định', s.seo.defaultDescription, '/admin/thuong-hieu');
  check('Về COMPA', 'Tiêu đề', s.pages.studio.title, '/admin/noi-dung');
  check('Về COMPA', 'Nội dung', s.pages.studio.body, '/admin/noi-dung');
  check('Liên hệ', 'Tiêu đề', s.pages.contact.title, '/admin/noi-dung');
  check('Liên hệ', 'Lời giới thiệu', s.pages.contact.intro, '/admin/noi-dung');
  check('Thông báo', 'Trang 404', s.pages.notFound, '/admin/noi-dung');
  check('Dịch vụ', 'Giới thiệu', s.services.intro, '/admin/noi-dung');
  for (const it of s.services.items) {
    check(`Dịch vụ: ${it.title.vi}`, 'Tên', it.title, '/admin/noi-dung');
    check(`Dịch vụ: ${it.title.vi}`, 'Mô tả', it.body, '/admin/noi-dung');
  }
  s.hero.slides.forEach((sl, i) => check('Ảnh mở đầu', `Alt ảnh ${i + 1}`, sl.alt, '/admin/anh-mo-dau'));
  for (const p of r.projects) {
    const link = `/admin/du-an/${p.id}`;
    const name = `Dự án: ${p.title.vi || p.slug}`;
    check(name, 'Tên', p.title, link);
    check(name, 'Địa điểm', p.location, link);
    check(name, 'Mô tả', p.description, link);
    check(name, 'Tiêu đề SEO', p.seo.title, link);
    check(name, 'Mô tả meta', p.seo.description, link);
    p.groups.forEach((g) => check(name, `Tên nhóm “${g.title.vi || g.title.en}”`, g.title, link));
    const altMissing = p.images.filter((i) => missingTranslation(i.alt)).length;
    if (altMissing) out.push({ where: name, field: `Alt của ${altMissing} ảnh`, lang: 'en', link });
  }
  return out;
}

export const countMissingTranslations = (r: Records) => listMissingTranslations(r).length;
