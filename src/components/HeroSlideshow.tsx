import { useEffect, useState } from 'react';
import type { AssetMap, HeroSlide } from '../content/types';
import { useLang, useT } from '../i18n';
import { Picture } from './Picture';

const INTERVAL_MS = 6000;

/**
 * Full-viewport crossfading slideshow. Only the current slide and the next one are mounted,
 * so later slides load just before they appear. Respects prefers-reduced-motion and offers pause.
 */
export function HeroSlideshow({ slides, assets }: { slides: HeroSlide[]; assets: AssetMap }) {
  const t = useT();
  const lang = useLang();
  const [index, setIndex] = useState(0);
  const [playing, setPlaying] = useState(true);
  const [reduced, setReduced] = useState(false);
  const [loaded, setLoaded] = useState<Set<number>>(() => new Set([0]));
  const count = slides.length;

  useEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    const update = () => setReduced(mq.matches);
    update();
    mq.addEventListener('change', update);
    return () => mq.removeEventListener('change', update);
  }, []);

  const autoplay = playing && !reduced && count > 1;

  useEffect(() => {
    if (!autoplay) return;
    // Prepare the next slide shortly before switching.
    const pre = window.setTimeout(() => setLoaded((s) => new Set(s).add((index + 1) % count)), INTERVAL_MS - 2500);
    const id = window.setTimeout(() => setIndex((i) => (i + 1) % count), INTERVAL_MS);
    return () => {
      window.clearTimeout(pre);
      window.clearTimeout(id);
    };
  }, [autoplay, index, count]);

  if (!count) return <div className="hero__slides hero__slides--empty" />;

  return (
    <>
      <div className="hero__slides" aria-roledescription="carousel" aria-label={t('home.slides')}>
        {slides.map((slide, i) => {
          if (!loaded.has(i) && i !== index) return null;
          return (
            <div
              key={slide.id}
              className={`hero__slide${i === index ? ' is-active' : ''}`}
              aria-hidden={i !== index}
              role="group"
              aria-roledescription="slide"
              aria-label={t('home.slideOf', { n: i + 1, total: count })}
            >
              <Picture
                asset={assets[slide.assetId]}
                alt={slide.alt[lang] || slide.alt.vi}
                sizes="100vw"
                priority={i === 0}
                focalPoint={slide.focalPoint}
              />
            </div>
          );
        })}
      </div>
      {count > 1 && !reduced && (
        <button type="button" className="hero__pause" onClick={() => setPlaying((p) => !p)} aria-pressed={!playing}>
          {playing ? (
            <svg viewBox="0 0 12 12" width="11" height="11" aria-hidden="true" focusable="false">
              <path d="M3 1.5v9M9 1.5v9" stroke="currentColor" strokeWidth="1.6" />
            </svg>
          ) : (
            <svg viewBox="0 0 12 12" width="11" height="11" aria-hidden="true" focusable="false">
              <path d="M3 1.5l7 4.5-7 4.5z" fill="currentColor" />
            </svg>
          )}
          <span className="visually-hidden">{playing ? t('home.pause') : t('home.play')}</span>
        </button>
      )}
    </>
  );
}
