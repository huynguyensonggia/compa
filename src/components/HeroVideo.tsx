import { useEffect, useRef, useState } from 'react';

interface Props {
  src: string;
  /** First frame, shown while the video loads. */
  poster: string;
  /** Final frame as a still: faded in when the video ends, and shown directly for reduced motion. */
  endImage?: string;
  /** Stops the intro and reveals the final shot immediately. */
  skipRequested?: boolean;
  /**
   * Called once when the hero content may appear: the video ended — or it cannot play
   * (autoplay blocked, load error), the visitor prefers reduced motion, or it took too long.
   */
  onFinish?: () => void;
}

/** Give up waiting for the video after this long (slow connections). */
const MAX_WAIT_MS = 15000;

/**
 * Full-viewport background video for the home hero: autoplay, muted, plays ONCE and then holds
 * on the final shot (no loop). Pauses while the tab is hidden and resumes where it left off.
 * Framing is plain object-fit: cover — no scaling.
 */
export function HeroVideo({ src, poster, endImage, skipRequested, onFinish }: Props) {
  const ref = useRef<HTMLVideoElement>(null);
  const [ended, setEnded] = useState(false);
  const [reduced, setReduced] = useState(false);
  const finishRef = useRef(onFinish);
  finishRef.current = onFinish;

  useEffect(() => {
    if (!skipRequested) return;
    const video = ref.current;
    if (!video) return;
    video.pause();
    setEnded(true);
    finishRef.current?.();
  }, [skipRequested]);

  useEffect(() => {
    const video = ref.current;
    if (!video) return;
    let done = false;
    const finish = () => {
      if (done) return;
      done = true;
      finishRef.current?.();
    };
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    const sync = () => {
      setReduced(mq.matches);
      if (mq.matches) {
        video.pause();
        finish();
      } else if (document.hidden || video.ended) {
        video.pause();
      } else {
        void video.play().catch(() => {
          // autoplay blocked: keep the poster and show the content right away
          finish();
        });
      }
    };
    const onEnded = () => {
      setEnded(true);
      finish();
    };
    const timer = window.setTimeout(finish, MAX_WAIT_MS);
    sync();
    video.addEventListener('ended', onEnded);
    video.addEventListener('error', finish);
    mq.addEventListener('change', sync);
    document.addEventListener('visibilitychange', sync);
    return () => {
      window.clearTimeout(timer);
      video.removeEventListener('ended', onEnded);
      video.removeEventListener('error', finish);
      mq.removeEventListener('change', sync);
      document.removeEventListener('visibilitychange', sync);
    };
  }, [src]);

  const showEnd = !!endImage && (ended || reduced);

  return (
    <div className="hero__slides" aria-hidden="true">
      <video
        ref={ref}
        className="hero__video"
        src={src}
        poster={poster || undefined}
        muted
        playsInline
        preload="auto"
        disablePictureInPicture
      />
      {endImage && <img className={`hero__video-end${showEnd ? ' is-visible' : ''}`} src={endImage} alt="" loading="lazy" decoding="async" />}
    </div>
  );
}
