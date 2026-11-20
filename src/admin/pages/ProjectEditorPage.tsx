import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useAdminData } from '../AdminData';
import { saveProject, ValidationError } from '../data/repository';
import { newId, slugify } from '../data/slug';
import { validateProject } from '../data/validate';
import { GalleryManager, DEFAULT_GROUPS } from '../components/GalleryManager';
import { AssetPicker, thumbSrc } from '../components/AssetPicker';
import { BiField, Field, IssueList, SaveState, timeNow, useUnsavedGuard } from '../components/ui';
import { SeoPreview } from '../components/SeoPreview';
import { CATEGORIES, type Category, type ProjectFull, type Lang } from '../../content/types';
import { LangProvider, translate } from '../../i18n';
import { ProjectDetailView } from '../../pages/ProjectDetailView';
import { projectDescription, projectTitle } from '../../seo/meta';
import { paths } from '../../routing/paths';
import { projectPath, sortedTypes } from '../../content/projectTypes';

const CAT_LABEL: Record<Category, string> = { architecture: 'Kiến trúc', interior: 'Nội thất', landscape: 'Cảnh quan', construction: 'Thi công' };

function blankProject(sortOrder: number): ProjectFull {
  const id = newId('prj');
  return {
    id,
    slug: '',
    status: 'draft',
    sortOrder,
    isDemo: false,
    title: { vi: '', en: '' },
    location: { vi: '', en: '' },
    year: null,
    categories: [],
    description: { vi: '', en: '' },
    coverAssetId: null,
    seo: { title: { vi: '', en: '' }, description: { vi: '', en: '' }, ogAssetId: null },
    updatedAt: new Date().toISOString(),
    typeId: null,
    publishedPaths: null,
    groups: DEFAULT_GROUPS.map((t, i) => ({ id: newId('grp'), projectId: id, title: { ...t }, sortOrder: i })),
    images: [],
  };
}

export function ProjectEditorPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { records, assets, reload } = useAdminData();
  const existing = records?.projects.find((p) => p.id === id);
  const [saved, setSaved] = useState<ProjectFull | null>(null);
  const [draft, setDraft] = useState<ProjectFull | null>(null);
  const [slugTouched, setSlugTouched] = useState(false);
  const [savedAt, setSavedAt] = useState<string | null>(null);
  const [errors, setErrors] = useState<string[]>([]);
  const [picker, setPicker] = useState<null | 'cover' | 'og'>(null);
  const [preview, setPreview] = useState<Lang | null>(null);

  useEffect(() => {
    if (!records || draft) return;
    const start = existing ? structuredClone(existing) : blankProject(records.projects.length);
    setSaved(existing ? structuredClone(existing) : null);
    setDraft(start);
    setSlugTouched(!!existing);
  }, [records, existing, draft]);

  const dirty = useMemo(() => !!draft && JSON.stringify(draft) !== JSON.stringify(saved ?? null), [draft, saved]);
  useUnsavedGuard(dirty);

  if (!records) return null;
  if (id && !existing && !draft) return <p>Không tìm thấy dự án.</p>;
  if (!draft) return null;

  const others = records.projects.filter((p) => p.id !== draft.id);
  const update = (patch: Partial<ProjectFull>) => setDraft((d) => (d ? { ...d, ...patch } : d));
  const wasPublished = saved?.status === 'published';
  const livePath = saved?.publishedPaths?.vi ?? null;
  const nextPath = projectPath(records.site, draft, 'vi');
  const slugChangedLive = !!livePath && !!nextPath && livePath !== nextPath;
  const types = sortedTypes(records.site);
  const unclassified = draft.images.filter((i) => i.groupId === null).length;
  const issues = validateProject(draft, others, draft.status);

  const persist = async (status: 'draft' | 'published') => {
    const next = { ...draft, status };
    if (status === 'published' && slugChangedLive) {
      if (!confirm(`Đổi đường dẫn của dự án đang công khai:\n${livePath}\n→ ${nextPath}\nĐường dẫn cũ sẽ được chuyển hướng 301 sang đường dẫn mới. Tiếp tục?`)) return;
    }
    try {
      const result = await saveProject(next);
      setErrors([]);
      setSaved(structuredClone(result));
      setDraft(structuredClone(result));
      setSavedAt(timeNow());
      await reload();
      if (!id) navigate(`/admin/du-an/${result.id}`, { replace: true });
    } catch (e) {
      setErrors(e instanceof ValidationError ? e.issues : [(e as Error).message]);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const galleryAssetIds = Array.from(new Set(draft.images.map((i) => i.assetId)));
  const cover = draft.coverAssetId ? assets[draft.coverAssetId] : undefined;
  const ogAsset = draft.seo.ogAssetId ? assets[draft.seo.ogAssetId] : cover;

  return (
    <div className="a-page a-editor">
      <div className="a-page__head a-sticky">
        <div>
          <h1>{existing ? draft.title.vi || 'Dự án' : 'Thêm dự án'}</h1>
          <SaveState dirty={dirty} savedAt={savedAt} />
          <span className={`a-badge ${draft.status === 'published' ? 'a-badge--ok' : ''}`}>{draft.status === 'published' ? 'Công khai' : 'Nháp'}</span>
        </div>
        <div className="a-toolbar">
          <button type="button" className="a-btn" onClick={() => setPreview('vi')}>
            Xem trước trang chi tiết
          </button>
          {wasPublished ? (
            <>
              <button type="button" className="a-btn" onClick={() => persist('draft')}>
                Chuyển về nháp
              </button>
              <button type="button" className="a-btn a-btn--primary" onClick={() => persist('published')}>
                Lưu thay đổi
              </button>
            </>
          ) : (
            <>
              <button type="button" className="a-btn" onClick={() => persist('draft')}>
                Lưu nháp
              </button>
              <button type="button" className="a-btn a-btn--primary" onClick={() => persist('published')}>
                Công khai
              </button>
            </>
          )}
        </div>
      </div>

      {errors.length > 0 && <IssueList issues={errors.map((message) => ({ level: 'error' as const, message }))} />}
      {unclassified > 0 && (
        <p className="a-issue a-issue--warning">
          Còn {unclassified} ảnh chưa phân loại. Vẫn lưu nháp được, nhưng {wasPublished ? 'không lưu được thay đổi cho dự án đang công khai' : 'chưa công khai được'} cho tới
          khi chuyển hết các ảnh này vào nhóm.
        </p>
      )}
      <IssueList issues={issues.filter((i) => i.level === 'warning')} />

      <section className="a-card">
        <h2>Thông tin dự án</h2>
        <BiField
          label="Tên dự án"
          required
          value={draft.title}
          onChange={(title) => update({ title, ...(slugTouched ? {} : { slug: slugify(title.vi) }) })}
        />
        <Field label="Danh mục" hint="Danh mục cha hiển thị ở trang Dự án (Biệt thự, Khách sạn, Nhà hàng, Coffee…). Quản lý ở mục “Danh mục dự án”.">
          {(fid) => (
            <select id={fid} value={draft.typeId ?? ''} onChange={(e) => update({ typeId: e.target.value || null })} className={!draft.typeId ? 'is-missing' : ''}>
              <option value="">— Chọn danh mục —</option>
              {types.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.title.vi}
                </option>
              ))}
            </select>
          )}
        </Field>
        <Field
          label="Slug (đường dẫn)"
          hint={
            <>
              {projectPath(records.site, { ...draft, slug: draft.slug || '…' }, 'vi') ?? `/du-an/{danh-mục}/${draft.slug || '…'}/`} — tự gợi ý từ tên tiếng Việt.
              {slugChangedLive && (
                <span className="a-warn-inline"> Đường dẫn của dự án đã công khai sẽ đổi từ {livePath} sang {nextPath}; khi lưu sẽ tạo chuyển hướng 301.</span>
              )}
            </>
          }
        >
          {(fid) => (
            <div className="a-inline">
              <input
                id={fid}
                value={draft.slug}
                onChange={(e) => {
                  setSlugTouched(true);
                  update({ slug: e.target.value.toLowerCase() });
                }}
                onBlur={() => update({ slug: slugify(draft.slug) })}
              />
              <button type="button" className="a-btn a-btn--ghost a-btn--sm" onClick={() => update({ slug: slugify(draft.title.vi) })}>
                Gợi ý lại
              </button>
            </div>
          )}
        </Field>
        <BiField label="Địa điểm" value={draft.location} onChange={(location) => update({ location })} placeholder={{ vi: 'Ví dụ: Cẩm Thanh, Hội An', en: 'e.g. Cam Thanh, Hoi An' }} hint="Chỉ nhập khi đã xác nhận." />
        <Field label="Năm hoàn thành" hint="Để trống nếu chưa xác nhận.">
          {(fid) => (
            <input
              id={fid}
              type="number"
              inputMode="numeric"
              min={1950}
              max={2100}
              value={draft.year ?? ''}
              onChange={(e) => update({ year: e.target.value ? Number(e.target.value) : null })}
              className="a-input-sm"
            />
          )}
        </Field>
        <fieldset className="a-bifield">
          <legend>Hạng mục</legend>
          <div className="a-checks">
            {CATEGORIES.map((c) => (
              <label key={c} className="a-check">
                <input
                  type="checkbox"
                  checked={draft.categories.includes(c)}
                  onChange={(e) => update({ categories: e.target.checked ? [...draft.categories, c] : draft.categories.filter((x) => x !== c) })}
                />{' '}
                {CAT_LABEL[c]}
              </label>
            ))}
          </div>
        </fieldset>
        <BiField
          label="Mô tả dự án"
          multiline
          rows={6}
          value={draft.description}
          onChange={(description) => update({ description })}
          hint="Khoảng 80–200 từ: công trình gì, ở đâu, đặc điểm chính. Để trống thì khối mô tả được ẩn."
        />
        <label className="a-check">
          <input type="checkbox" checked={draft.isDemo} onChange={(e) => update({ isDemo: e.target.checked })} /> Dự án minh họa (không gán là công trình COMPA thực hiện)
        </label>
      </section>

      <section className="a-card">
        <h2>Ảnh bìa</h2>
        <div className="a-cover">
          <div className="a-cover__img">{cover ? <img src={thumbSrc(cover)} alt="" /> : <span>Chưa chọn</span>}</div>
          <div>
            <p className="a-hint">Ảnh bìa dùng cho lưới dự án và ảnh chia sẻ mặc định. Chọn ảnh bìa không thay đổi nhóm hay thứ tự gallery.</p>
            <button type="button" className="a-btn" onClick={() => setPicker('cover')}>
              Chọn ảnh bìa…
            </button>
          </div>
        </div>
      </section>

      <section className="a-card">
        <h2>Gallery theo không gian</h2>
        <GalleryManager
          projectId={draft.id}
          groups={draft.groups}
          images={draft.images}
          assets={assets}
          coverAssetId={draft.coverAssetId}
          onChange={({ groups, images }) => update({ groups, images })}
          onSetCover={(coverAssetId) => update({ coverAssetId })}
        />
      </section>

      <section className="a-card">
        <h2>SEO</h2>
        <BiField
          label="Tiêu đề SEO"
          value={draft.seo.title}
          counter={{ min: 50, max: 60 }}
          onChange={(title) => update({ seo: { ...draft.seo, title } })}
          placeholder={{ vi: projectTitle(records.site, { ...draft, seo: { ...draft.seo, title: { vi: '', en: '' } } }, 'vi'), en: projectTitle(records.site, { ...draft, seo: { ...draft.seo, title: { vi: '', en: '' } } }, 'en') }}
          hint="Để trống sẽ dùng mẫu: {Tên dự án} – {Địa điểm} | COMPA Architecture."
        />
        <BiField
          label="Mô tả meta"
          multiline
          rows={3}
          counter={{ min: 140, max: 160 }}
          value={draft.seo.description}
          onChange={(description) => update({ seo: { ...draft.seo, description } })}
          hint="Viết tự nhiên, có loại công trình + địa danh. Để trống sẽ lấy câu đầu của mô tả dự án."
        />
        <div className="a-cover">
          <div className="a-cover__img">{ogAsset ? <img src={thumbSrc(ogAsset)} alt="" /> : <span>Chưa có</span>}</div>
          <div>
            <p className="a-hint">Ảnh chia sẻ (Facebook/Zalo) được cắt 1200×630 theo điểm lấy nét khi build. Mặc định là ảnh bìa.</p>
            <div className="a-toolbar">
              <button type="button" className="a-btn" onClick={() => setPicker('og')}>
                Chọn ảnh chia sẻ…
              </button>
              {draft.seo.ogAssetId && (
                <button type="button" className="a-btn a-btn--ghost" onClick={() => update({ seo: { ...draft.seo, ogAssetId: null } })}>
                  Dùng ảnh bìa
                </button>
              )}
            </div>
          </div>
        </div>
        <div className="a-seo-previews">
          {(['vi', 'en'] as const).map((l) => (
            <SeoPreview
              key={l}
              lang={l}
              title={projectTitle(records.site, draft, l)}
              description={projectDescription(records.site, draft, l)}
              path={projectPath(records.site, { ...draft, slug: draft.slug || 'slug' }, l) ?? paths.projects(l)}
              image={ogAsset}
              siteName={records.site.brand.name}
            />
          ))}
        </div>
      </section>

      <AssetPicker
        open={picker !== null}
        title={picker === 'og' ? 'Chọn ảnh chia sẻ' : 'Chọn ảnh bìa'}
        suggested={galleryAssetIds}
        allAssets={assets}
        onClose={() => setPicker(null)}
        onPick={(assetId) => {
          if (picker === 'og') update({ seo: { ...draft.seo, ogAssetId: assetId } });
          else update({ coverAssetId: assetId });
          setPicker(null);
        }}
      />

      {preview && (
        <div className="a-preview" role="dialog" aria-modal="true" aria-label="Xem trước trang chi tiết">
          <div className="a-preview__bar">
            <strong>Xem trước (chưa lưu cũng hiển thị)</strong>
            <div className="a-toolbar">
              {(['vi', 'en'] as const).map((l) => (
                <button key={l} type="button" className={`a-btn a-btn--sm${preview === l ? ' a-btn--primary' : ''}`} onClick={() => setPreview(l)}>
                  {l.toUpperCase()}
                </button>
              ))}
              <button type="button" className="a-btn a-btn--sm" onClick={() => setPreview(null)} autoFocus>
                Đóng xem trước
              </button>
            </div>
          </div>
          <div className="a-preview__body site-main">
            <LangProvider lang={preview}>
              <p className="visually-hidden">{translate(preview, 'project.gallery')}</p>
              <ProjectDetailView project={draft} assets={assets} site={records.site} />
            </LangProvider>
          </div>
        </div>
      )}
    </div>
  );
}
