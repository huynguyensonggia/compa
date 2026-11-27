import { useEffect, useId, useRef, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { BrandLogo } from './BrandLogo';
import { LanguageSwitcher } from './LanguageSwitcher';
import { useLang, useT } from '../i18n';
import { paths } from '../routing/paths';
import { useContent } from '../content/ContentContext';

const LIGHT_HEADER = false;

export function SiteHeader() {
  const lang = useLang();
  const t = useT();
  const { site } = useContent();
  const { pathname } = useLocation();
  const [open, setOpen] = useState(false);
  const menuId = useId();
  const wrapRef = useRef<HTMLLIElement>(null);
  const btnRef = useRef<HTMLButtonElement>(null);
  const hoverCapable = useRef(false);
  const headerRef = useRef<HTMLElement>(null);
  const slotRef = useRef<HTMLDivElement>(null);
  // Scroll behaviour: the full header scrolls away with the page; once it is out of view a compact bar
  // pins to the top while scrolling up and hides while scrolling down. "pinned" = fixed (compact) layout.
  const [pinned, setPinned] = useState(false);
  const [shown, setShown] = useState(false);

  // The pricing page is reached from the category cards, so it counts as part of “Dự án”.
  const projectsActive = pathname.startsWith(paths.projects(lang)) || pathname.startsWith(paths.pricing(lang));
  const infoLinks = [
    { to: paths.studio(lang), label: t('nav.about') },
    ...(site.services.status === 'published' ? [{ to: paths.services(lang), label: t('nav.services') }] : []),
    { to: paths.contact(lang), label: t('nav.contact') },
  ];
  const infoActive = infoLinks.some((l) => pathname.startsWith(l.to));

  useEffect(() => {
    hoverCapable.current = window.matchMedia('(hover: hover) and (pointer: fine)').matches;
  }, []);

  useEffect(() => setOpen(false), [pathname]);

  useEffect(() => {
    let lastY = window.scrollY;
    let fullH = headerRef.current?.offsetHeight ?? 0;
    let isPinned = false;
    let ticking = false;
    const update = () => {
      ticking = false;
      const y = window.scrollY;
      const dy = y - lastY;
      if (!isPinned) fullH = headerRef.current?.offsetHeight ?? fullH;
      if (y <= fullH) {
        // full header (partly) in view: normal, in-flow header
        if (isPinned) {
          isPinned = false;
          if (slotRef.current) slotRef.current.style.height = '';
          setPinned(false);
          setShown(false);
        }
      } else {
        if (!isPinned) {
          isPinned = true;
          if (slotRef.current) slotRef.current.style.height = `${fullH}px`; // keep the space, no layout jump
          setPinned(true);
        }
        if (Math.abs(dy) > 6) {
          setShown(dy < 0);
          if (dy > 0) setOpen(false);
        }
      }
      if (Math.abs(dy) > 6 || y <= fullH) lastY = y;
    };
    const onScroll = () => {
      if (!ticking) {
        ticking = true;
        requestAnimationFrame(update);
      }
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    update();
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => {
    if (!open) return;
    const onDoc = (e: MouseEvent) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setOpen(false);
        btnRef.current?.focus();
      }
    };
    document.addEventListener('mousedown', onDoc);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onDoc);
      document.removeEventListener('keydown', onKey);
    };
  }, [open]);

  return (
    <div className="site-header-slot" ref={slotRef}>
    <header
      ref={headerRef}
      className={`site-header${LIGHT_HEADER ? ' site-header--light' : ''}${pinned ? ' is-pinned' : ''}${pinned && shown ? ' is-shown' : ''}`}
      onFocus={() => pinned && setShown(true)}
    >
      <a className="skip-link" href="#main">
        {t('skip')}
      </a>
      <div className="site-header__lang">
        <LanguageSwitcher tone={LIGHT_HEADER ? 'light' : 'dark'} />
      </div>
      <Link to={paths.home(lang)} className="site-header__logo">
        <BrandLogo variant="header" transparent={LIGHT_HEADER} />
      </Link>
      <nav className="site-nav" aria-label={t('nav.main')}>
        <ul className="site-nav__list">
          <li>
            <Link
              to={paths.projects(lang)}
              className={`site-nav__link${projectsActive ? ' is-active' : ''}`}
              aria-current={projectsActive ? 'page' : undefined}
            >
              {t('nav.projects')}
            </Link>
          </li>
          <li
            className="site-nav__dropdown"
            ref={wrapRef}
            onMouseEnter={() => hoverCapable.current && setOpen(true)}
            onMouseLeave={() => hoverCapable.current && setOpen(false)}
          >
            <button
              ref={btnRef}
              type="button"
              className={`site-nav__link site-nav__button${infoActive ? ' is-active' : ''}`}
              aria-expanded={open}
              aria-controls={menuId}
              onClick={() => setOpen((v) => !v)}
            >
              {t('nav.info')}
              <svg viewBox="0 0 10 6" width="8" height="5" aria-hidden="true" focusable="false">
                <path d="M1 1l4 4 4-4" fill="none" stroke="currentColor" strokeWidth="1.3" />
              </svg>
            </button>
            <ul id={menuId} className={`site-nav__submenu${open ? ' is-open' : ''}`}>
              {infoLinks.map((l) => {
                const active = pathname.startsWith(l.to);
                return (
                  <li key={l.to}>
                    <Link to={l.to} aria-current={active ? 'page' : undefined} className={active ? 'is-active' : undefined}>
                      {l.label}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </li>
        </ul>
      </nav>
    </header>
    </div>
  );
}
