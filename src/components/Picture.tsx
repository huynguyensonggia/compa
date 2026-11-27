import { useEffect, useRef, useState } from 'react';
import type { FocalPoint, ResolvedAsset } from '../content/types';
import { useT } from '../i18n';

interface Props {
  asset: ResolvedAsset | undefined;
  alt: string;
  sizes?: string;
  className?: string;
  priority?: boolean;
  /** Load immediately (above the fold) without raising fetch priority. */
  eager?: boolean;
  focalPoint?: FocalPoint;
  /** Render with object-fit: contain instead of cover. */
  contain?: boolean;
}

/** Responsive image with intrinsic size (no layout shift), lazy-loading and a quiet error fallback. */
export function Picture({ asset, alt, sizes = '100vw', className, priority, eager, focalPoint, contain }: Props) {
  const t = useT();
  const [failed, setFailed] = useState(false);
  // "is-loaded" lets CSS fade images in once decoded (only where a stylesheet opts in, e.g. galleries).
  const [loaded, setLoaded] = useState(false);
  const imgRef = useRef<HTMLImageElement>(null);
  useEffect(() => {
    if (imgRef.current?.complete) setLoaded(true); // already loaded before hydration (cache, eager)
  }, [asset?.src]);
  if (!asset || !asset.src || failed) {
    return (
      <span className={`img-fallback ${className ?? ''}`} role="img" aria-label={alt || t('image.error')}>
        <span aria-hidden="true">{t('image.error')}</span>
      </span>
    );
  }
  const extra: Record<string, string> = priority ? { fetchpriority: 'high' } : {};
  return (
    <img
      ref={imgRef}
      className={`${className ?? ''}${loaded ? ' is-loaded' : ''}`.trim() || undefined}
      src={asset.src}
      srcSet={asset.srcSet}
      sizes={asset.srcSet ? sizes : undefined}
      width={asset.width}
      height={asset.height}
      alt={alt}
      loading={priority || eager ? 'eager' : 'lazy'}
      decoding={priority ? 'sync' : 'async'}
      style={{
        objectFit: contain ? 'contain' : 'cover',
        objectPosition: focalPoint ? `${focalPoint.x * 100}% ${focalPoint.y * 100}%` : undefined,
      }}
      onLoad={() => setLoaded(true)}
      onError={() => setFailed(true)}
      {...extra}
    />
  );
}
