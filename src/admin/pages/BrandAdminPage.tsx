import { useState } from 'react';
import { useAdminData } from '../AdminData';
import { useSiteForm } from './useSiteForm';
import { AssetPicker, thumbSrc } from '../components/AssetPicker';
import { BiField, Counter, Field, SaveState, IssueList } from '../components/ui';
import type { SiteContent } from '../../content/types';

export function BrandAdminPage() {
  const { assets } = useAdminData();
  const { draft, setDraft, dirty, savedAt, save, errors } = useSiteForm();
  const [picking, setPicking] = useState(false);
  if (!draft) return null;
  const set = (fn: (d: SiteContent) => void) => {
    const next = structuredClone(draft);
    fn(next);
    setDraft(next);
  };
  const c = draft.contact;
  const logo = draft.brand.logoAssetId ? assets[draft.brand.logoAssetId] : undefined;
  const phoneOk = /^\+84\d{9,10}$/.test(c.phoneE164);
  const emailOk = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(c.email);

  const text = (label: string, value: string, onChange: (v: string) => void, hint?: string, type = 'text') => (
    <Field label={label} hint={hint}>
      {(id) => <input id={id} type={type} value={value} onChange={(e) => onChange(e.target.value)} />}
    </Field>
  );

  return (
    <div className="a-page">
      <div className="a-page__head a-sticky">
        <div>
          <h1>Thương hiệu & Liên hệ</h1>
          <SaveState dirty={dirty} savedAt={savedAt} />
        </div>
        <button type="button" className="a-btn a-btn--primary" onClick={save} disabled={!dirty || !phoneOk || !emailOk}>
          Lưu
        </button>
      </div>
      <IssueList issues={errors.map((message) => ({ level: 'error' as const, message }))} />
      <p className="a-hint">
        Đây là nguồn NAP (tên, địa chỉ, điện thoại) duy nhất: dùng cho footer, trang Liên hệ, dữ liệu có cấu trúc (JSON-LD) và nội dung chia sẻ. Giữ đúng một cách viết.
      </p>

      <section className="a-card">
        <h2>Thương hiệu</h2>
        {text('Tên hiển thị', draft.brand.name, (v) => set((d) => void (d.brand.name = v)), 'Dùng đúng một dạng ở mọi nơi: “COMPA Architecture Hội An”.')}
        {text('Tên ngắn', draft.brand.shortName, (v) => set((d) => void (d.brand.shortName = v)))}
        <BiField label="Thông điệp" value={draft.brand.tagline} onChange={(v) => set((d) => void (d.brand.tagline = v))} />
        <BiField label="Mô tả ngắn" value={draft.brand.description} onChange={(v) => set((d) => void (d.brand.description = v))} />
        <div className="a-cover">
          <div className="a-cover__img a-cover__img--logo">{logo ? <img src={thumbSrc(logo)} alt="Logo" /> : <span>Đang dùng chữ tạm “COMPA”</span>}</div>
          <div>
            <p className="a-hint">
              Logo gốc (PNG nền trong suốt hoặc ảnh vuông nền xám). Hiển thị nguyên bản, không đổi màu, không cắt chữ phụ. Với bản build chính thức, có thể đặt file tại
              public/brand/logo.png và khai báo brand.logoFile.
            </p>
            <div className="a-toolbar">
              <button type="button" className="a-btn" onClick={() => setPicking(true)}>
                Chọn logo…
              </button>
              {logo && (
                <button type="button" className="a-btn a-btn--ghost" onClick={() => set((d) => void (d.brand.logoAssetId = null))}>
                  Gỡ logo
                </button>
              )}
            </div>
          </div>
        </div>
      </section>

      <section className="a-card">
        <h2>Liên hệ</h2>
        {text('Điện thoại (hiển thị)', c.phone, (v) => set((d) => void (d.contact.phone = v)))}
        {text('Điện thoại (định dạng quốc tế)', c.phoneE164, (v) => set((d) => void (d.contact.phoneE164 = v.replace(/\s/g, ''))), phoneOk ? 'Dùng cho liên kết tel: và JSON-LD.' : '⚠ Cần dạng +84xxxxxxxxx', 'tel')}
        {text('Email', c.email, (v) => set((d) => void (d.contact.email = v.trim())), emailOk ? undefined : '⚠ Email không hợp lệ', 'email')}
        {text('Số nhà, đường', c.address.streetAddress, (v) => set((d) => void (d.contact.address.streetAddress = v)))}
        {text('Phường', c.address.addressLocality, (v) => set((d) => void (d.contact.address.addressLocality = v)))}
        {text('Tỉnh / Thành phố', c.address.addressRegion, (v) => set((d) => void (d.contact.address.addressRegion = v)))}
        <BiField
          label="Địa chỉ hiển thị"
          value={c.address.display}
          onChange={(v) => set((d) => void (d.contact.address.display = v))}
          hint="Bản tiếng Anh giữ nguyên tên riêng. Không thêm mã bưu chính hay địa chỉ khác."
        />
        {text('Facebook', c.facebook, (v) => set((d) => void (d.contact.facebook = v.trim())), 'Chỉ liên kết đã xác minh. Để trống = không hiện nút.', 'url')}
        {text('Instagram', c.instagram ?? '', (v) => set((d) => void (d.contact.instagram = v.trim())), 'Ví dụ https://www.instagram.com/ten-tai-khoan — chỉ nhập khi đã xác minh. Để trống = không hiện nút.', 'url')}
        {text('TikTok', c.tiktok ?? '', (v) => set((d) => void (d.contact.tiktok = v.trim())), 'Ví dụ https://www.tiktok.com/@ten-tai-khoan — chỉ nhập khi đã xác minh. Để trống = không hiện nút.', 'url')}
      </section>

      <section className="a-card">
        <h2>Google Business Profile (để trống tới khi xác minh)</h2>
        {text('Link địa điểm Google Maps', c.googleMapsPlaceUrl, (v) => set((d) => void (d.contact.googleMapsPlaceUrl = v.trim())), 'Khi có giá trị: hiện nút “Chỉ đường” và hasMap trong JSON-LD.', 'url')}
        {text('URL bản đồ nhúng', c.mapEmbedUrl, (v) => set((d) => void (d.contact.mapEmbedUrl = v.trim())), 'Bản đồ chỉ tải khi khách bấm “Xem bản đồ”.', 'url')}
        <div className="a-inline">
          {text('Vĩ độ', c.geo ? String(c.geo.lat) : '', (v) => set((d) => void (d.contact.geo = v ? { lat: Number(v), lng: d.contact.geo?.lng ?? 0 } : null)))}
          {text('Kinh độ', c.geo ? String(c.geo.lng) : '', (v) => set((d) => void (d.contact.geo = v ? { lat: d.contact.geo?.lat ?? 0, lng: Number(v) } : null)))}
        </div>
        {text(
          'Giờ làm việc',
          c.openingHours.join('; '),
          (v) => set((d) => void (d.contact.openingHours = v.split(';').map((s) => s.trim()).filter(Boolean))),
          'Định dạng schema.org, ngăn cách bằng dấu chấm phẩy, ví dụ: Mo-Fr 08:00-17:30; Sa 08:00-12:00',
        )}
        {text('Link xin đánh giá', c.gbpReviewUrl, (v) => set((d) => void (d.contact.gbpReviewUrl = v.trim())), undefined, 'url')}
      </section>

      <section className="a-card">
        <h2>SEO & đo lường</h2>
        <label className="a-check">
          <input type="checkbox" checked={draft.seo.allowIndexing} onChange={(e) => set((d) => void (d.seo.allowIndexing = e.target.checked))} /> Cho phép Google index
          (allowIndexing)
        </label>
        <p className="a-hint">Chỉ bật khi đã thay toàn bộ dự án minh họa bằng dự án thật và khách đã duyệt.</p>
        <BiField
          label="Tiêu đề trang chủ"
          value={draft.seo.homeTitle}
          counter={{ min: 50, max: 72 }}
          onChange={(v) => set((d) => void (d.seo.homeTitle = v))}
        />
        <BiField
          label="Mô tả mặc định"
          multiline
          rows={3}
          counter={{ min: 140, max: 160 }}
          value={draft.seo.defaultDescription}
          onChange={(v) => set((d) => void (d.seo.defaultDescription = v))}
        />
        {text('Google Tag Manager ID', draft.seo.gtmId, (v) => set((d) => void (d.seo.gtmId = v.trim())), 'Ví dụ GTM-XXXXXXX. Trống = không tải script nào.')}
        {text('GA4 Measurement ID', draft.seo.ga4Id, (v) => set((d) => void (d.seo.ga4Id = v.trim())), 'Ví dụ G-XXXXXXXXXX. Chỉ dùng khi không có GTM.')}
        {text('Mã xác minh Google Search Console', draft.seo.googleSiteVerification, (v) => set((d) => void (d.seo.googleSiteVerification = v.trim())))}
        <p className="a-hint">
          Độ dài tiêu đề hiện tại: <Counter value={draft.seo.homeTitle.vi} min={50} max={72} />
        </p>
      </section>

      <AssetPicker
        open={picking}
        title="Chọn logo"
        allAssets={assets}
        onClose={() => setPicking(false)}
        onPick={(assetId) => {
          set((d) => void (d.brand.logoAssetId = assetId));
          setPicking(false);
        }}
      />
    </div>
  );
}
