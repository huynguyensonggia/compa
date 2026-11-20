import { useEffect, useState } from 'react';
import type { AssetMap, HeroSlide } from '../content/types';
import { useLang, useT } from '../i18n';
import { Picture } from './Picture';

const INTERVAL_MS = 3000;

/**
 * Full-viewport crossfading slideshow. Only the current slide and the next one are mounted,
 * so later slides load just before they appear. Stops for prefers-reduced-motion and while the tab is hidden.
 */
export function HeroSlideshow({ slides, assets }: { slides: HeroSlide[]; assets: AssetMap }) {
  const t = useT();
  const lang = useLang();
  const [index, setIndex] = useState(0);
  // Paused while the browser tab is hidden.
  const [playing, setPlaying] = useState(true);
  const [reduced, setReduced] = useState(false);
  const [loaded, setLoaded] = useState<Set<number>>(() => new Set([0]));
  const count = slides.length;

  useEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    const update = () => setReduced(mq.matches);
    update();
    mq.addEventListener('change', update);
    const onVisibility = () => setPlaying(!document.hidden);
    document.addEventListener('visibilitychange', onVisibility);
    return () => {
      mq.removeEventListener('change', update);
      document.removeEventListener('visibilitychange', onVisibility);
    };
  }, []);

  const autoplay = playing && !reduced && count > 1;

  useEffect(() => {
    if (!autoplay) return;
    // Prepare the next slide shortly before switching.
    const pre = window.setTimeout(() => setLoaded((s) => new Set(s).add((index + 1) % count)), Math.max(0, INTERVAL_MS - 2500));
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
    </>
  );
}
