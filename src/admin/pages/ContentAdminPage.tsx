import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAdminData } from '../AdminData';
import { useSiteForm } from './useSiteForm';
import { AssetPicker, thumbSrc } from '../components/AssetPicker';
import { BiField, SaveState, IssueList } from '../components/ui';
import { listMissingTranslations } from './translations';
import type { SiteContent } from '../../content/types';

export function ContentAdminPage() {
  const { records, assets } = useAdminData();
  const { draft, setDraft, dirty, savedAt, save, errors } = useSiteForm();
  const [picking, setPicking] = useState(false);
  if (!draft || !records) return null;
  const set = (fn: (d: SiteContent) => void) => {
    const next = structuredClone(draft);
    fn(next);
    setDraft(next);
  };
  const missing = listMissingTranslations({ ...records, site: draft });
  const studioImg = draft.pages.studio.imageAssetId ? assets[draft.pages.studio.imageAssetId] : undefined;

  return (
    <div className="a-page">
      <div className="a-page__head a-sticky">
        <div>
          <h1>Nội dung Việt–Anh</h1>
          <SaveState dirty={dirty} savedAt={savedAt} />
        </div>
        <button type="button" className="a-btn a-btn--primary" onClick={save} disabled={!dirty}>
          Lưu
        </button>
      </div>
      <IssueList issues={errors.map((message) => ({ level: 'error' as const, message }))} />

      <section className="a-card">
        <h2>Trường còn thiếu bản dịch ({missing.length})</h2>
        {missing.length ? (
          <ul className="a-list">
            {missing.map((m, i) => (
              <li key={i}>
                <Link to={m.link}>{m.where}</Link> — {m.field}: thiếu {m.lang === 'en' ? 'tiếng Anh' : 'tiếng Việt'}
              </li>
            ))}
          </ul>
        ) : (
          <p>Không có trường nào thiếu bản dịch.</p>
        )}
        <p className="a-hint">Chuỗi giao diện (menu, nút, nhãn lightbox…) nằm trong src/i18n/vi.ts và src/i18n/en.ts.</p>
      </section>

      <section className="a-card">
        <h2>Về COMPA</h2>
        <BiField label="Tiêu đề" value={draft.pages.studio.title} onChange={(v) => set((d) => void (d.pages.studio.title = v))} />
        <BiField
          label="Nội dung"
          multiline
          rows={7}
          value={draft.pages.studio.body}
          onChange={(v) => set((d) => void (d.pages.studio.body = v))}
          hint="Ngăn đoạn bằng một dòng trống. Không đưa số năm kinh nghiệm, nhân sự, giải thưởng chưa xác minh."
        />
        <div className="a-cover">
          <div className="a-cover__img">{studioImg ? <img src={thumbSrc(studioImg)} alt="" /> : <span>Chưa có ảnh</span>}</div>
          <div className="a-toolbar">
            <button type="button" className="a-btn" onClick={() => setPicking(true)}>
              Chọn ảnh…
            </button>
            {studioImg && (
              <button type="button" className="a-btn a-btn--ghost" onClick={() => set((d) => void (d.pages.studio.imageAssetId = null))}>
                Gỡ ảnh
              </button>
            )}
          </div>
        </div>
      </section>

      <section className="a-card">
        <h2>Liên hệ</h2>
        <BiField label="Tiêu đề" value={draft.pages.contact.title} onChange={(v) => set((d) => void (d.pages.contact.title = v))} />
        <BiField label="Lời giới thiệu" multiline rows={2} value={draft.pages.contact.intro} onChange={(v) => set((d) => void (d.pages.contact.intro = v))} />
      </section>

      <section className="a-card">
        <h2>Thông báo</h2>
        <BiField label="Trang không tồn tại (404)" multiline rows={2} value={draft.pages.notFound} onChange={(v) => set((d) => void (d.pages.notFound = v))} />
      </section>

      <section className="a-card">
        <h2>Dịch vụ</h2>
        <p className="a-hint">
          Trang Dịch vụ chỉ xuất hiện trong menu GIỚI THIỆU, được prerender và vào sitemap khi ở trạng thái Công khai. Không bịa quy trình, bảng giá hay số năm kinh nghiệm.
        </p>
        <label className="a-check">
          <input
            type="checkbox"
            checked={draft.services.status === 'published'}
            onChange={(e) => set((d) => void (d.services.status = e.target.checked ? 'published' : 'draft'))}
          />{' '}
          Công khai trang tổng “Dịch vụ”
        </label>
        <BiField label="Tiêu đề trang" value={draft.services.title} onChange={(v) => set((d) => void (d.services.title = v))} />
        <BiField label="Giới thiệu" multiline rows={3} value={draft.services.intro} onChange={(v) => set((d) => void (d.services.intro = v))} />
        {draft.services.items.map((it, i) => (
          <div key={it.key} className="a-subcard">
            <h3>
              {it.title.vi}{' '}
              {!it.body.vi.trim() && <span className="a-badge a-badge--warn">Cần khách cung cấp</span>}
              <span className={`a-badge ${it.status === 'published' ? 'a-badge--ok' : ''}`}>{it.status === 'published' ? 'Công khai' : 'Nháp'}</span>
            </h3>
            <BiField label="Tên" value={it.title} onChange={(v) => set((d) => void (d.services.items[i].title = v))} />
            <BiField label="Slug" value={it.slug} onChange={(v) => set((d) => void (d.services.items[i].slug = v))} />
            <BiField label="Mô tả (1–2 đoạn)" multiline rows={4} value={it.body} onChange={(v) => set((d) => void (d.services.items[i].body = v))} />
            <label className="a-check">
              <input
                type="checkbox"
                checked={it.status === 'published'}
                disabled={!it.body.vi.trim()}
                onChange={(e) => set((d) => void (d.services.items[i].status = e.target.checked ? 'published' : 'draft'))}
              />{' '}
              Công khai trang này {!it.body.vi.trim() && '(cần có mô tả trước)'}
            </label>
          </div>
        ))}
      </section>

      <AssetPicker
        open={picking}
        title="Chọn ảnh cho trang Về COMPA"
        allAssets={assets}
        onClose={() => setPicking(false)}
        onPick={(assetId) => {
          set((d) => void (d.pages.studio.imageAssetId = assetId));
          setPicking(false);
        }}
      />
    </div>
  );
}
