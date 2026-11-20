import { useState } from 'react';
import { useAdminData } from '../AdminData';
import { useSiteForm } from './useSiteForm';
import { AssetPicker, thumbSrc } from '../components/AssetPicker';
import { BiField, SaveState } from '../components/ui';
import { newId } from '../data/slug';
import type { HeroSlide } from '../../content/types';

export function HeroAdminPage() {
  const { assets } = useAdminData();
  const { draft, setDraft, dirty, savedAt, save } = useSiteForm();
  const [picking, setPicking] = useState(false);
  if (!draft) return null;
  const slides = draft.hero.slides;
  const setSlides = (next: HeroSlide[]) => setDraft({ ...draft, hero: { slides: next } });
  const move = (i: number, d: number) => {
    const j = i + d;
    if (j < 0 || j >= slides.length) return;
    const next = [...slides];
    [next[i], next[j]] = [next[j], next[i]];
    setSlides(next);
  };

  return (
    <div className="a-page">
      <div className="a-page__head a-sticky">
        <div>
          <h1>Ảnh mở đầu</h1>
          <SaveState dirty={dirty} savedAt={savedAt} />
        </div>
        <button type="button" className="a-btn a-btn--primary" onClick={save} disabled={!dirty}>
          Lưu
        </button>
      </div>
      <p className="a-hint">Trang chủ hiển thị 4–6 ảnh, chuyển cảnh khoảng 6 giây. Ảnh đầu tiên được tải ưu tiên. Nhấn lên ảnh để đặt điểm lấy nét (vùng luôn giữ khi cắt).</p>
      {(slides.length < 4 || slides.length > 6) && <p className="a-issue a-issue--warning">Nên có 4–6 ảnh (hiện có {slides.length}).</p>}
      <ol className="a-slides">
        {slides.map((s, i) => {
          const a = assets[s.assetId];
          return (
            <li key={s.id} className="a-card a-slide">
              <button
                type="button"
                className="a-focal a-slide__img"
                aria-label={`Đặt điểm lấy nét cho ảnh ${i + 1}`}
                onClick={(e) => {
                  const r = e.currentTarget.getBoundingClientRect();
                  const fp = { x: Math.round(((e.clientX - r.left) / r.width) * 100) / 100, y: Math.round(((e.clientY - r.top) / r.height) * 100) / 100 };
                  setSlides(slides.map((x) => (x.id === s.id ? { ...x, focalPoint: fp } : x)));
                }}
              >
                {a && <img src={thumbSrc(a)} alt="" />}
                {s.focalPoint && <span className="a-focal__dot" style={{ left: `${s.focalPoint.x * 100}%`, top: `${s.focalPoint.y * 100}%` }} />}
              </button>
              <div className="a-slide__body">
                <p className="a-slide__no">Ảnh {i + 1}{i === 0 && ' · tải ưu tiên'}</p>
                <BiField label="Mô tả ảnh (alt)" value={s.alt} onChange={(alt) => setSlides(slides.map((x) => (x.id === s.id ? { ...x, alt } : x)))} />
                <div className="a-toolbar">
                  <button type="button" className="a-btn a-btn--ghost a-btn--sm" onClick={() => move(i, -1)} disabled={i === 0}>
                    ↑ Lên
                  </button>
                  <button type="button" className="a-btn a-btn--ghost a-btn--sm" onClick={() => move(i, 1)} disabled={i === slides.length - 1}>
                    ↓ Xuống
                  </button>
                  {s.focalPoint && (
                    <button type="button" className="a-btn a-btn--ghost a-btn--sm" onClick={() => setSlides(slides.map((x) => (x.id === s.id ? { ...x, focalPoint: null } : x)))}>
                      Bỏ điểm lấy nét
                    </button>
                  )}
                  <button
                    type="button"
                    className="a-btn a-btn--ghost a-btn--sm a-btn--danger"
                    onClick={() => confirm(`Gỡ ảnh ${i + 1} khỏi trang mở đầu?`) && setSlides(slides.filter((x) => x.id !== s.id))}
                  >
                    Gỡ
                  </button>
                </div>
              </div>
            </li>
          );
        })}
      </ol>
      <button type="button" className="a-btn" onClick={() => setPicking(true)}>
        + Thêm ảnh
      </button>
      <AssetPicker
        open={picking}
        title="Thêm ảnh mở đầu"
        allAssets={assets}
        onClose={() => setPicking(false)}
        onPick={(assetId, rec) => {
          setSlides([...slides, { id: newId('sld'), assetId, alt: rec?.alt ? { ...rec.alt } : { vi: '', en: '' }, focalPoint: null }]);
          setPicking(false);
        }}
      />
    </div>
  );
}
