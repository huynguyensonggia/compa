import { useEffect, useMemo, useRef, useState, type CSSProperties } from 'react';

/**
 * Random Character Fade (staggered random letter opacity reveal), like Canva's "Merge" effect.
 *
 * - Splits text into grapheme clusters (Vietnamese diacritics stay intact), grouped per word so
 *   words never break mid-way; real spaces are kept between words.
 * - Each character only animates opacity (no movement), in a shuffled order spread over `duration`.
 * - Starts when the element enters the viewport (IntersectionObserver), or follows `show` if given.
 * - Exit: `show={false}` (or `exitOnLeave`) fades characters out in another random order.
 * - The shuffle is seeded by the text, so prerendered HTML and the browser produce identical markup.
 * - Screen readers get the full text once; without JavaScript the text is simply visible.
 */
interface Props {
  text: string;
  className?: string;
  /** Total time for all characters to finish, in ms (default 1400). */
  duration?: number;
  /** Delay before the reveal starts once triggered, in ms. */
  delay?: number;
  /** Controlled visibility. When omitted, the viewport decides. */
  show?: boolean;
  /** Fade out again when scrolled out of view (viewport mode). */
  exitOnLeave?: boolean;
  /** Reveal order: shuffled (default) or a sweep from left to right. */
  order?: 'random' | 'ltr';
}

const EASE = 'cubic-bezier(0.25, 0.1, 0.25, 1)';

function graphemes(text: string): string[] {
  const Seg = (Intl as unknown as { Segmenter?: new (l?: string, o?: { granularity: string }) => { segment(s: string): Iterable<{ segment: string }> } }).Segmenter;
  if (Seg) return Array.from(new Seg('vi', { granularity: 'grapheme' }).segment(text), (s) => s.segment);
  // Fallback: attach combining marks to the previous character.
  const out: string[] = [];
  for (const ch of Array.from(text)) {
    if (out.length && /\p{M}/u.test(ch)) out[out.length - 1] += ch;
    else out.push(ch);
  }
  return out;
}

/** Small seeded PRNG (mulberry32) so the "random" order is stable between server and client. */
function seeded(seedText: string) {
  let h = 1779033703 ^ seedText.length;
  for (let i = 0; i < seedText.length; i++) {
    h = Math.imul(h ^ seedText.charCodeAt(i), 3432918353);
    h = (h << 13) | (h >>> 19);
  }
  let a = h >>> 0;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function shuffledRanks(n: number, seedText: string): number[] {
  const rand = seeded(seedText);
  const order = Array.from({ length: n }, (_, i) => i);
  for (let i = n - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    [order[i], order[j]] = [order[j], order[i]];
  }
  const ranks = new Array<number>(n);
  order.forEach((charIndex, rank) => (ranks[charIndex] = rank));
  return ranks;
}

export function RandomFadeText({ text, className, duration = 1400, delay = 0, show, exitOnLeave = false, order = 'random' }: Props) {
  const ref = useRef<HTMLSpanElement>(null);
  const [inView, setInView] = useState(false);
  const [armed, setArmed] = useState(false);

  const words = useMemo(() => {
    // words with their characters; spaces between words are rendered as plain text
    let index = 0;
    return text.split(/(\s+)/).map((part) =>
      /^\s+$/.test(part) ? { space: part, chars: [] as { ch: string; i: number }[] } : { space: '', chars: graphemes(part).map((ch) => ({ ch, i: index++ })) },
    );
  }, [text]);
  const count = words.reduce((n, w) => n + w.chars.length, 0);
  const inRanks = useMemo(
    () => (order === 'ltr' ? Array.from({ length: count }, (_, i) => i) : shuffledRanks(count, text)),
    [count, text, order],
  );
  const outRanks = useMemo(
    () => (order === 'ltr' ? inRanks : shuffledRanks(count, `${text}::out`)),
    [count, text, order, inRanks],
  );

  useEffect(() => {
    setArmed(true);
    if (show !== undefined) return;
    const el = ref.current;
    if (!el || !('IntersectionObserver' in window)) {
      setInView(true);
      return;
    }
    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setInView(true);
          if (!exitOnLeave) io.disconnect();
        } else if (exitOnLeave) {
          setInView(false);
        }
      },
      { threshold: 0.3 },
    );
    io.observe(el);
    return () => io.disconnect();
  }, [show, exitOnLeave]);

  const visible = show ?? inView;
  // Each character fades over ~55% of the total; start times are spread over the rest.
  const charDur = Math.round(duration * 0.55);
  const spread = duration - charDur;
  const at = (rank: number) => (count > 1 ? Math.round((rank / (count - 1)) * spread) : 0);

  return (
    <span
      ref={ref}
      className={`rf${visible ? ' is-in' : ''}${armed ? ' is-armed' : ''}${className ? ` ${className}` : ''}`}
      style={{ '--rf-dur': `${charDur}ms`, '--rf-ease': EASE } as CSSProperties}
    >
      <span className="visually-hidden">{text}</span>
      <span aria-hidden="true">
        {words.map((w, wi) =>
          w.space ? (
            w.space
          ) : (
            <span key={wi} className="rf__word">
              {w.chars.map(({ ch, i }) => (
                <span
                  key={i}
                  className="rf__char"
                  style={{ '--rf-in': `${delay + at(inRanks[i])}ms`, '--rf-out': `${at(outRanks[i])}ms` } as CSSProperties}
                >
                  {ch}
                </span>
              ))}
            </span>
          ),
        )}
      </span>
    </span>
  );
}
