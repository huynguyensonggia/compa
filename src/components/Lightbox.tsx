import { useCallback, useEffect, useRef } from 'react';
import type { AssetMap, GalleryImage } from '../content/types';
import { useLang, useT } from '../i18n';
import { Picture } from './Picture';

interface Props {
  groupTitle: string;
  images: GalleryImage[];
  index: number;
  assets: AssetMap;
  onIndexChange: (i: number) => void;
  onClose: () => void;
}

/**
 * Lightbox limited to one space group: stops at the first/last image (no wrap-around,
 * never jumps to another group). Traps focus while open; the caller restores focus on close.
 */
export function Lightbox({ groupTitle, images, index, assets, onIndexChange, onClose }: Props) {
  const t = useT();
  const lang = useLang();
  const dialogRef = useRef<HTMLDivElement>(null);
  const closeRef = useRef<HTMLButtonElement>(null);
  const img = images[index];
  const atStart = index <= 0;
  const atEnd = index >= images.length - 1;

  const prev = useCallback(() => !atStart && onIndexChange(index - 1), [atStart, index, onIndexChange]);
  const next = useCallback(() => !atEnd && onIndexChange(index + 1), [atEnd, index, onIndexChange]);

  useEffect(() => {
    closeRef.current?.focus();
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = prevOverflow;
    };
  }, []);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        onClose();
      } else if (e.key === 'ArrowLeft') {
        e.preventDefault();
        prev();
      } else if (e.key === 'ArrowRight') {
        e.preventDefault();
        next();
      } else if (e.key === 'Tab' && dialogRef.current) {
        const focusables = Array.from(dialogRef.current.querySelectorAll<HTMLElement>('button:not([disabled])'));
        if (!focusables.length) return;
        const first = focusables[0];
        const last = focusables[focusables.length - 1];
        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault();
          last.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [next, prev, onClose]);

  // Keep focus inside when a nav button becomes disabled at either end.
  useEffect(() => {
    if (document.activeElement instanceof HTMLButtonElement && document.activeElement.disabled) closeRef.current?.focus();
  }, [index]);

  if (!img) return null;
  const alt = img.alt[lang] || img.alt.vi;
  const counter = `${groupTitle} — ${index + 1}/${images.length}`;

  return (
    <div
      className="lightbox"
      role="dialog"
      aria-modal="true"
      aria-label={`${t('lightbox.label')}: ${counter}`}
      ref={dialogRef}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="lightbox__bar">
        <p className="lightbox__counter" aria-live="polite">
          {counter}
        </p>
        <button ref={closeRef} type="button" className="lightbox__close" onClick={onClose}>
          <span className="visually-hidden">{t('lightbox.close')}</span>
          <svg viewBox="0 0 20 20" width="20" height="20" aria-hidden="true" focusable="false">
            <path d="M4 4l12 12M16 4L4 16" stroke="currentColor" strokeWidth="1.4" fill="none" />
          </svg>
        </button>
      </div>
      <figure className="lightbox__figure">
        <Picture key={img.id} asset={assets[img.assetId]} alt={alt} sizes="100vw" contain priority />
      </figure>
      <button type="button" className="lightbox__nav lightbox__nav--prev" onClick={prev} disabled={atStart}>
        <span className="visually-hidden">{t('lightbox.prev')}</span>
        <svg viewBox="0 0 12 24" width="14" height="28" aria-hidden="true" focusable="false">
          <path d="M11 1L1 12l10 11" stroke="currentColor" strokeWidth="1.3" fill="none" />
        </svg>
      </button>
      <button type="button" className="lightbox__nav lightbox__nav--next" onClick={next} disabled={atEnd}>
        <span className="visually-hidden">{t('lightbox.next')}</span>
        <svg viewBox="0 0 12 24" width="14" height="28" aria-hidden="true" focusable="false">
          <path d="M1 1l10 11L1 23" stroke="currentColor" strokeWidth="1.3" fill="none" />
        </svg>
      </button>
    </div>
  );
}
