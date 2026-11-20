import type { Lang, ResolvedAsset } from '../../content/types';
import { absUrl } from '../../seo/config';
import { thumbSrc } from './AssetPicker';

/** Approximate Google result + Facebook/Zalo link card. */
export function SeoPreview({
  lang,
  title,
  description,
  path,
  image,
  siteName,
}: {
  lang: Lang;
  title: string;
  description: string;
  path: string;
  image?: ResolvedAsset;
  siteName: string;
}) {
  const url = absUrl(path);
  const host = url.replace(/^https?:\/\//, '').split('/')[0] || 'compaarchitecture-hoian.vn';
  const cut = (s: string, n: number) => (s.length > n ? s.slice(0, n - 1) + '…' : s);
  return (
    <div className="a-seo">
      <p className="a-seo__label">{lang === 'vi' ? 'Tiếng Việt' : 'English'} — Google</p>
      <div className="a-seo__google">
        <span className="a-seo__url">{url}</span>
        <span className="a-seo__title">{cut(title, 60)}</span>
        <span className="a-seo__desc">{cut(description, 160)}</span>
      </div>
      <p className="a-seo__label">Facebook / Zalo</p>
      <div className="a-seo__fb">
        <div className="a-seo__fbimg">{image && <img src={thumbSrc(image)} alt="" />}</div>
        <div className="a-seo__fbtext">
          <span className="a-seo__host">{host.toUpperCase()}</span>
          <span className="a-seo__fbtitle">{cut(title, 88)}</span>
          <span className="a-seo__fbdesc">{cut(description, 110)}</span>
          <span className="visually-hidden">{siteName}</span>
        </div>
      </div>
    </div>
  );
}
