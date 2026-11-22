import { useContent } from '../content/ContentContext';

interface Props {
  variant?: 'header' | 'hero' | 'footer';
  /** Use the transparent wordmark (background keyed out) instead of the square charcoal file. */
  transparent?: boolean;
}

/**
 * COMPA logo. Uses the original logo when provided (admin upload or brand.logoFile);
 * otherwise a clearly TEMPORARY text wordmark — NOT the original logo artwork (no compass symbol).
 * Replace by placing the file at public/brand/logo.png and setting brand.logoFile in content/site.json.
 */
export function BrandLogo({ variant = 'header', transparent = false }: Props) {
  const { site, assets } = useContent();
  const { brand } = site;
  const uploaded = brand.logoAssetId ? assets[brand.logoAssetId] : undefined;
  // Over the hero photo: transparent wordmark (background keyed out of the original file).
  if ((variant === 'hero' || transparent) && !uploaded && brand.logoOnPhotoFile) {
    return (
      <span className="brand-logo brand-logo--on-photo">
        <img src={brand.logoOnPhotoFile} alt={brand.name} width={960} height={304} />
      </span>
    );
  }
  const src = uploaded?.src || brand.logoFile;
  if (src) {
    return (
      <span className={`brand-logo brand-logo--${variant}`}>
        <img src={src} alt={brand.name} width={uploaded?.width ?? 640} height={uploaded?.height ?? 640} decoding="async" />
      </span>
    );
  }
  return (
    <span className={`brand-logo brand-logo--${variant} brand-logo--temporary`} data-temporary-logo="true">
      <svg viewBox="0 0 200 200" role="img" aria-label={brand.name} focusable="false">
        <rect width="200" height="200" fill="var(--brand-charcoal)" />
        <text x="100" y="112" textAnchor="middle" fill="var(--brand-sand)" fontSize="38" fontWeight="400" letterSpacing="4" fontFamily="var(--font-sans)">
          {brand.logoText}
        </text>
        <text x="100" y="134" textAnchor="middle" fill="var(--brand-sand)" fontSize="7.4" letterSpacing="0.4" fontFamily="var(--font-sans)" textLength="168" lengthAdjust="spacingAndGlyphs">
          {brand.logoSubline}
        </text>
      </svg>
    </span>
  );
}
