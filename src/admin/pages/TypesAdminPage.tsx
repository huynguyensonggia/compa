import { useState } from 'react';
import { useAdminData } from '../AdminData';
import { useSiteForm } from './useSiteForm';
import { AssetPicker, thumbSrc } from '../components/AssetPicker';
import { BiField, IssueList, SaveState } from '../components/ui';
import { PriceTableEditor } from '../components/PriceTableEditor';
import { CATEGORY_ICONS, CategoryIcon, type CategoryIconKey } from '../../components/CategoryIcon';
import { newId, slugify } from '../data/slug';
import { saveProject, ValidationError } from '../data/repository';
import { byOrder } from '../../content/resolve';
import type { ProjectType } from '../../content/types';

/** Parent categories shown on /du-an/ (Biệt thự, Khách sạn, Nhà hàng, Coffee…). */
export function TypesAdminPage() {
  const { records, assets, reload } = useAdminData();
  const { draft, setDraft, dirty, savedAt, save, errors } = useSiteForm();
  const [picking, setPicking] = useState<string | null>(null);
  const [autoSlug, setAutoSlug] = useState<Set<string>>(new Set());
  const [moveTo, setMoveTo] = useState<Record<string, string>>({});
  const [msg, setMsg] = useState<string | null>(null);
  if (!draft || !records) return null;

  const types = [...draft.projectTypes].sort(byOrder);
  const setTypes = (next: ProjectType[]) => setDraft({ ...draft, projectTypes: next.map((t, i) => ({ ...t, sortOrder: i })) });
  const patch = (id: string, p: Partial<ProjectType>) => setTypes(types.map((t) => (t.id === id ? { ...t, ...p } : t)));
  const move = (i: number, d: number) => {
    const j = i + d;
    if (j < 0 || j >= types.length) return;
    const next = [...types];
    [next[i], next[j]] = [next[j], next[i]];
    setTypes(next);
  };
  const projectsOf = (id: string) => records.projects.filter((p) => p.typeId === id);
  const savedIds = new Set(records.site.projectTypes.map((t) => t.id));

  const add = () => {
    const id = newId('typ');
    setAutoSlug((s) => new Set(s).add(id));
    setTypes([...types, { id, slug: { vi: '', en: '' }, title: { vi: '', en: '' }, description: { vi: '', en: '' }, coverAssetId: null, sortOrder: types.length, prices: [], icon: '' }]);
  };

  const moveProjects = async (fromId: string) => {
    const target = moveTo[fromId];
    if (!target || !savedIds.has(target)) return;
    const list = projectsOf(fromId);
    if (!confirm(`Chuyển ${list.length} dự án sang danh mục khác? Dự án đang công khai sẽ đổi đường dẫn (tự tạo chuyển hướng 301).`)) return;
    try {
      for (const p of list) await saveProject({ ...p, typeId: target });
      await reload();
      setMsg(`Đã chuyển ${list.length} dự án.`);
    } catch (e) {
      setMsg(e instanceof ValidationError ? e.issues.join(' ') : (e as Error).message);
    }
  };

  return (
    <div className="a-page">
      <div className="a-page__head a-sticky">
        <div>
          <h1>Danh mục dự án</h1>
          <SaveState dirty={dirty} savedAt={savedAt} />
        </div>
        <button type="button" className="a-btn a-btn--primary" onClick={save} disabled={!dirty}>
          Lưu
        </button>
      </div>
      <IssueList issues={errors.map((message) => ({ level: 'error' as const, message }))} />
      {msg && <p className="a-issue a-issue--ok">{msg}</p>}
      <p className="a-hint">
        Trang Dự án hiển thị các danh mục này theo thứ tự dưới đây (bảng đơn giá của từng danh mục hiện ở trang Đơn giá); khách bấm vào danh mục để xem các dự án bên trong. Danh mục chưa có dự án công khai sẽ tự ẩn. Đổi slug
        của danh mục đang có dự án công khai sẽ tự tạo chuyển hướng 301.
      </p>

      {types.map((t, i) => {
        const list = projectsOf(t.id);
        const published = list.filter((p) => p.status === 'published').length;
        const cover = t.coverAssetId ? assets[t.coverAssetId] : undefined;
        const others = types.filter((x) => x.id !== t.id && savedIds.has(x.id));
        return (
          <section key={t.id} className="a-card">
            <h2>
              {t.title.vi || 'Danh mục mới'}{' '}
              <span className="a-badge">
                {list.length} dự án · {published} công khai
              </span>
              {published === 0 && <span className="a-badge a-badge--warn">Đang ẩn trên website</span>}
            </h2>
            <BiField
              label="Tên danh mục"
              required
              value={t.title}
              onChange={(title) =>
                patch(t.id, { title, ...(autoSlug.has(t.id) ? { slug: { vi: slugify(title.vi), en: slugify(title.en) } } : {}) })
              }
              placeholder={{ vi: 'Ví dụ: Khách sạn', en: 'e.g. Hotels' }}
            />
            <BiField
              label="Slug (đường dẫn)"
              value={t.slug}
              onChange={(slug) => {
                setAutoSlug((s) => {
                  const n = new Set(s);
                  n.delete(t.id);
                  return n;
                });
                patch(t.id, { slug: { vi: slug.vi.toLowerCase(), en: slug.en.toLowerCase() } });
              }}
              hint={`/du-an/${t.slug.vi || '…'}/ · /en/projects/${t.slug.en || '…'}/`}
            />
            <BiField
              label="Mô tả ngắn (tùy chọn)"
              multiline
              rows={2}
              value={t.description}
              onChange={(description) => patch(t.id, { description })}
              hint="Hiển thị dưới tiêu đề trang danh mục và dùng làm mô tả meta. Để trống nếu chưa có nội dung xác nhận."
            />
            <fieldset className="a-bifield">
              <legend>Biểu tượng (hiện trước tên danh mục ở trang Dự án)</legend>
              <div className="a-icons" role="radiogroup" aria-label={`Biểu tượng cho ${t.title.vi || 'danh mục'}`}>
                <label className={`a-icons__item${!t.icon ? ' is-on' : ''}`}>
                  <input type="radio" name={`icon-${t.id}`} checked={!t.icon} onChange={() => patch(t.id, { icon: '' })} />
                  <span className="a-icons__none">—</span>
                  <span className="a-icons__label">Không dùng</span>
                </label>
                {(Object.keys(CATEGORY_ICONS) as CategoryIconKey[]).map((key) => (
                  <label key={key} className={`a-icons__item${t.icon === key ? ' is-on' : ''}`}>
                    <input type="radio" name={`icon-${t.id}`} checked={t.icon === key} onChange={() => patch(t.id, { icon: key })} />
                    <CategoryIcon kind={key} className="a-icons__svg" />
                    <span className="a-icons__label">{CATEGORY_ICONS[key].label}</span>
                  </label>
                ))}
              </div>
            </fieldset>
            <PriceTableEditor items={t.prices ?? []} onChange={(prices) => patch(t.id, { prices })} />
            <div className="a-cover">
              <div className="a-cover__img">{cover ? <img src={thumbSrc(cover)} alt="" /> : <span>Tự dùng ảnh bìa của dự án đầu tiên</span>}</div>
              <div className="a-toolbar">
                <button type="button" className="a-btn" onClick={() => setPicking(t.id)}>
                  Chọn ảnh đại diện…
                </button>
                {cover && (
                  <button type="button" className="a-btn a-btn--ghost" onClick={() => patch(t.id, { coverAssetId: null })}>
                    Dùng ảnh dự án đầu tiên
                  </button>
                )}
              </div>
            </div>
            <div className="a-toolbar">
              <button type="button" className="a-btn a-btn--ghost a-btn--sm" onClick={() => move(i, -1)} disabled={i === 0} aria-label={`Đưa ${t.title.vi} lên`}>
                ↑ Lên
              </button>
              <button
                type="button"
                className="a-btn a-btn--ghost a-btn--sm"
                onClick={() => move(i, 1)}
                disabled={i === types.length - 1}
                aria-label={`Đưa ${t.title.vi} xuống`}
              >
                ↓ Xuống
              </button>
              {list.length === 0 ? (
                <button
                  type="button"
                  className="a-btn a-btn--ghost a-btn--sm a-btn--danger"
                  onClick={() => confirm(`Xóa danh mục “${t.title.vi || 'mới'}”?`) && setTypes(types.filter((x) => x.id !== t.id))}
                >
                  Xóa danh mục
                </button>
              ) : (
                <span className="a-inline">
                  <span className="a-hint">Muốn xóa: chuyển {list.length} dự án sang</span>
                  <select aria-label="Danh mục đích" value={moveTo[t.id] ?? ''} onChange={(e) => setMoveTo({ ...moveTo, [t.id]: e.target.value })}>
                    <option value="">— chọn —</option>
                    {others.map((o) => (
                      <option key={o.id} value={o.id}>
                        {o.title.vi}
                      </option>
                    ))}
                  </select>
                  <button type="button" className="a-btn a-btn--sm" disabled={!moveTo[t.id] || dirty} onClick={() => moveProjects(t.id)} title={dirty ? 'Lưu thay đổi trước' : undefined}>
                    Chuyển
                  </button>
                </span>
              )}
            </div>
          </section>
        );
      })}

      <button type="button" className="a-btn" onClick={add}>
        + Thêm danh mục
      </button>

      <AssetPicker
        open={picking !== null}
        title="Chọn ảnh đại diện cho danh mục"
        suggested={picking ? Array.from(new Set(projectsOf(picking).flatMap((p) => [p.coverAssetId, ...p.images.map((im) => im.assetId)]).filter((x): x is string => !!x))) : []}
        allAssets={assets}
        onClose={() => setPicking(null)}
        onPick={(assetId) => {
          if (picking) patch(picking, { coverAssetId: assetId });
          setPicking(null);
        }}
      />
    </div>
  );
}
