import type { PriceItem } from '../../content/types';
import { formatPrice } from '../../content/pricing';
import { newId } from '../data/slug';

/** Edit one category's price lines (label vi/en, amount in VND, unit, note). */
export function PriceTableEditor({ items, onChange }: { items: PriceItem[]; onChange: (next: PriceItem[]) => void }) {
  const set = (id: string, patch: Partial<PriceItem>) => onChange(items.map((i) => (i.id === id ? { ...i, ...patch } : i)));
  const move = (idx: number, d: number) => {
    const j = idx + d;
    if (j < 0 || j >= items.length) return;
    const next = [...items];
    [next[idx], next[j]] = [next[j], next[idx]];
    onChange(next);
  };
  const add = () =>
    onChange([...items, { id: newId('prc'), label: { vi: '', en: '' }, amount: null, unit: { vi: 'm²', en: 'm²' }, note: { vi: '', en: '' } }]);

  return (
    <fieldset className="a-bifield a-prices">
      <legend>Bảng đơn giá</legend>
      {items.length > 0 && (
        <div className="a-prices__scroll">
          <table className="a-prices__table">
            <thead>
              <tr>
                <th>Hạng mục (VI)</th>
                <th>Hạng mục (EN)</th>
                <th>Đơn giá (VNĐ)</th>
                <th>Đơn vị</th>
                <th>Ghi chú (VI / EN)</th>
                <th>
                  <span className="visually-hidden">Thao tác</span>
                </th>
              </tr>
            </thead>
            <tbody>
              {items.map((it, i) => (
                <tr key={it.id}>
                  <td>
                    <input aria-label={`Hạng mục ${i + 1} (tiếng Việt)`} value={it.label.vi} onChange={(e) => set(it.id, { label: { ...it.label, vi: e.target.value } })} placeholder="Thiết kế kiến trúc" />
                  </td>
                  <td>
                    <input
                      aria-label={`Hạng mục ${i + 1} (tiếng Anh)`}
                      lang="en"
                      className={it.label.vi && !it.label.en ? 'is-missing' : ''}
                      value={it.label.en}
                      onChange={(e) => set(it.id, { label: { ...it.label, en: e.target.value } })}
                      placeholder="Architectural design"
                    />
                  </td>
                  <td>
                    <input
                      aria-label={`Đơn giá ${i + 1}`}
                      type="number"
                      inputMode="numeric"
                      min={0}
                      step={1000}
                      value={it.amount ?? ''}
                      placeholder="Liên hệ"
                      onChange={(e) => set(it.id, { amount: e.target.value === '' ? null : Math.max(0, Number(e.target.value)) })}
                    />
                    <span className="a-hint">{formatPrice(it, 'vi') ?? 'Hiển thị “Liên hệ”'}</span>
                  </td>
                  <td>
                    <input
                      aria-label={`Đơn vị ${i + 1}`}
                      className="a-prices__unit"
                      value={it.unit.vi}
                      onChange={(e) => set(it.id, { unit: { vi: e.target.value, en: e.target.value } })}
                      placeholder="m²"
                    />
                  </td>
                  <td>
                    <input aria-label={`Ghi chú ${i + 1} (tiếng Việt)`} value={it.note.vi} onChange={(e) => set(it.id, { note: { ...it.note, vi: e.target.value } })} />
                    <input
                      aria-label={`Ghi chú ${i + 1} (tiếng Anh)`}
                      lang="en"
                      value={it.note.en}
                      onChange={(e) => set(it.id, { note: { ...it.note, en: e.target.value } })}
                      placeholder="English"
                    />
                  </td>
                  <td className="a-prices__actions">
                    <button type="button" className="a-btn a-btn--ghost a-btn--sm" onClick={() => move(i, -1)} disabled={i === 0} aria-label={`Đưa dòng ${i + 1} lên`}>
                      ↑
                    </button>
                    <button
                      type="button"
                      className="a-btn a-btn--ghost a-btn--sm"
                      onClick={() => move(i, 1)}
                      disabled={i === items.length - 1}
                      aria-label={`Đưa dòng ${i + 1} xuống`}
                    >
                      ↓
                    </button>
                    <button type="button" className="a-btn a-btn--ghost a-btn--sm a-btn--danger" onClick={() => onChange(items.filter((x) => x.id !== it.id))} aria-label={`Xóa dòng ${i + 1}`}>
                      ✕
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      <button type="button" className="a-btn a-btn--sm" onClick={add}>
        + Thêm dòng giá
      </button>
      <p className="a-hint">Dòng có đơn giá thấp nhất hiển thị dưới thẻ danh mục ở trang Dự án (“Đơn giá từ …”). Để trống ô đơn giá để hiện “Liên hệ”.</p>
    </fieldset>
  );
}
