import { useState } from 'react';
import { useAdminData } from '../AdminData';
import { useSiteForm } from './useSiteForm';
import { AssetPicker, thumbSrc } from '../components/AssetPicker';
import { BiField, IssueList, SaveState } from '../components/ui';
import { PriceTableEditor } from '../components/PriceTableEditor';
import { CUSTOM_ICON, TypeIcon } from '../../components/CategoryIcon';
import { iconFromFile } from '../data/iconImage';
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
  const [removeBg, setRemoveBg] = useState(true);
  const [tolerance, setTolerance] = useState(18);
  const [iconMsg, setIconMsg] = useState<Record<string, string>>({});
  const [selectedId, setSelectedId] = useState<string | null>(null);
  if (!draft || !records) return null;

  const types = [...draft.projectTypes].sort(byOrder);
  const current = types.find((t) => t.id === selectedId) ?? types[0];
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
    setSelectedId(id);
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

      <div className="a-typepick">
        <div className="a-typepick__list" role="tablist" aria-label="Chọn danh mục để chỉnh sửa">
          {types.map((t) => {
            const count = projectsOf(t.id).length;
            const on = t.id === current?.id;
            return (
              <button
                key={t.id}
                type="button"
                role="tab"
                aria-selected={on}
                className={`a-typepick__item${on ? ' is-on' : ''}`}
                onClick={() => setSelectedId(t.id)}
              >
                <TypeIcon type={t} className="a-typepick__icon" />
                <span>{t.title.vi || 'Danh mục mới'}</span>
                <span className="a-typepick__count">{count}</span>
              </button>
            );
          })}
        </div>
        <button type="button" className="a-btn a-btn--primary" onClick={add}>
          + Thêm danh mục
        </button>
      </div>

      {types.filter((t) => t.id === current?.id).map((t) => {
        const i = types.indexOf(t);
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
                <label className={`a-icons__item${t.icon !== CUSTOM_ICON || !t.iconImage ? ' is-on' : ''}`}>
                  <input type="radio" name={`icon-${t.id}`} checked={t.icon !== CUSTOM_ICON || !t.iconImage} onChange={() => patch(t.id, { icon: '' })} />
                  <span className="a-icons__none">—</span>
                  <span className="a-icons__label">Không dùng</span>
                </label>
                {t.iconImage && (
                  <label className={`a-icons__item${t.icon === CUSTOM_ICON ? ' is-on' : ''}`}>
                    <input type="radio" name={`icon-${t.id}`} checked={t.icon === CUSTOM_ICON} onChange={() => patch(t.id, { icon: CUSTOM_ICON })} />
                    <TypeIcon type={{ ...t, icon: CUSTOM_ICON }} className="a-icons__svg" />
                    <span className="a-icons__label">Ảnh đã tải lên</span>
                  </label>
                )}
                <label className="a-icons__item a-icons__upload">
                  <input
                    type="file"
                    accept="image/png,image/webp,image/jpeg,image/svg+xml,.svg"
                    onChange={async (e) => {
                      const file = e.target.files?.[0];
                      e.target.value = '';
                      if (!file) return;
                      try {
                        const iconImage = await iconFromFile(file, { removeBackground: removeBg, tolerance });
                        patch(t.id, { icon: CUSTOM_ICON, iconImage });
                        setIconMsg((m) => ({ ...m, [t.id]: '' }));
                      } catch (err) {
                        setIconMsg((m) => ({ ...m, [t.id]: (err as Error).message }));
                      }
                    }}
                  />
                  <span className="a-icons__none" aria-hidden="true">＋</span>
                  <span className="a-icons__label">{t.iconImage ? 'Tải ảnh khác…' : 'Tải ảnh lên…'}</span>
                </label>
              </div>
              <div className="a-icon-opts">
                <label>
                  <input type="checkbox" checked={removeBg} onChange={(e) => setRemoveBg(e.target.checked)} /> Tự tách nền khi tải lên (ảnh nền trắng hoặc một màu)
                </label>
                {removeBg && (
                  <label>
                    Độ nhạy tách nền
                    <input type="range" min={4} max={40} value={tolerance} onChange={(e) => setTolerance(Number(e.target.value))} />
                    <span>{tolerance}</span>
                  </label>
                )}
                {t.iconImage && (
                  <>
                    <label>
                      <input type="checkbox" checked={!!t.iconKeepColor} onChange={(e) => patch(t.id, { iconKeepColor: e.target.checked })} /> Giữ màu gốc của ảnh (tắt = tô cùng màu với các biểu tượng nét)
                    </label>
                    <button
                      type="button"
                      className="a-btn a-btn--ghost"
                      onClick={() => patch(t.id, { iconImage: undefined, iconKeepColor: undefined, icon: t.icon === CUSTOM_ICON ? '' : t.icon })}
                    >
                      Xóa ảnh đã tải lên
                    </button>
                  </>
                )}
                <p className="a-hint">
                  PNG/WebP/JPG hoặc SVG. Ảnh đã tách nền (PNG trong suốt) được giữ nguyên; ảnh có nền trắng/một màu sẽ được tự tách nền nếu bật ô trên. Ảnh được thu nhỏ còn tối đa 160px và lưu cùng dữ liệu trang. Đổi độ nhạy rồi tải lại ảnh nếu tách nền chưa sạch.
                </p>
                {iconMsg[t.id] && (
                  <p className="a-error" role="alert">
                    {iconMsg[t.id]}
                  </p>
                )}
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
                  onClick={() => {
                    if (!confirm(`Xóa danh mục “${t.title.vi || 'mới'}”?`)) return;
                    setTypes(types.filter((x) => x.id !== t.id));
                    setSelectedId(null);
                  }}
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
