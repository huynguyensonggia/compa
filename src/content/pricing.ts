import type { Lang, PriceItem, ProjectType } from './types';

/** 300000 → “300.000 đ” (vi) / “300,000 VND” (en). */
export function formatVnd(amount: number, lang: Lang): string {
  return lang === 'vi' ? `${new Intl.NumberFormat('vi-VN').format(amount)} đ` : `${new Intl.NumberFormat('en-US').format(amount)} VND`;
}

export function formatPrice(item: Pick<PriceItem, 'amount' | 'unit'>, lang: Lang): string | null {
  if (item.amount === null || !Number.isFinite(item.amount)) return null;
  const unit = item.unit[lang] || item.unit.vi;
  return unit ? `${formatVnd(item.amount, lang)}/${unit}` : formatVnd(item.amount, lang);
}

/** Lowest priced line of a category (used for “Đơn giá từ …” on the card). */
export function lowestPrice(type: ProjectType): PriceItem | null {
  const priced = (type.prices ?? []).filter((p) => p.amount !== null && Number.isFinite(p.amount));
  if (!priced.length) return null;
  return priced.reduce((a, b) => ((b.amount as number) < (a.amount as number) ? b : a));
}

export const hasPrices = (type: ProjectType) => (type.prices ?? []).length > 0;
