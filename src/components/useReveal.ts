import { createElement, useEffect, useRef, useState, type HTMLAttributes, type ReactNode } from 'react';

/**
 * Scroll reveal: the element gets "is-in" once it enters the viewport (only once); CSS decides what animates.
 * - Hidden-before-reveal styles apply only under html.js, so no-JS visitors and crawlers see everything.
 * - "is-armed" is added after hydration; if scripts never run, a CSS fallback shows the content after 3 s.
 * - Server and first client render produce the same markup ("reveal"), so hydration stays clean.
 */
export function useReveal<T extends Element>(threshold = 0.15) {
  const ref = useRef<T>(null);
  const [armed, setArmed] = useState(false);
  const [inView, setInView] = useState(false);

  useEffect(() => {
    setArmed(true);
    const el = ref.current;
    if (!el || !('IntersectionObserver' in window)) {
      setInView(true);
      return;
    }
    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setInView(true);
          io.disconnect();
        }
      },
      { threshold, rootMargin: '0px 0px -8% 0px' },
    );
    io.observe(el);
    return () => io.disconnect();
  }, [threshold]);

  return { ref, className: `reveal${armed ? ' is-armed' : ''}${inView ? ' is-in' : ''}` };
}

type RevealProps = HTMLAttributes<HTMLElement> & { as?: 'section' | 'div' | 'ul'; threshold?: number; children?: ReactNode };

/** Element wrapper for useReveal (usable inside lists, where hooks cannot be called per item). */
export function Reveal({ as = 'div', threshold, className, children, ...rest }: RevealProps) {
  const r = useReveal<HTMLElement>(threshold);
  return createElement(as, { ...rest, ref: r.ref, className: `${r.className}${className ? ` ${className}` : ''}` }, children);
}
