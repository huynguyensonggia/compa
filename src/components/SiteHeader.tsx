import { useEffect, useId, useRef, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { BrandLogo } from './BrandLogo';
import { LanguageSwitcher } from './LanguageSwitcher';
import { useLang, useT } from '../i18n';
import { paths } from '../routing/paths';
import { useContent } from '../content/ContentContext';

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

  const projectsActive = pathname.startsWith(paths.projects(lang));
  const pricingActive = pathname.startsWith(paths.pricing(lang));
  const showPricing = site.pricing?.status === 'published';
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
    <header className="site-header">
      <a className="skip-link" href="#main">
        {t('skip')}
      </a>
      <div className="site-header__lang">
        <LanguageSwitcher />
      </div>
      <Link to={paths.home(lang)} className="site-header__logo">
        <BrandLogo variant="header" />
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
          {showPricing && (
            <li>
              <Link
                to={paths.pricing(lang)}
                className={`site-nav__link${pricingActive ? ' is-active' : ''}`}
                aria-current={pricingActive ? 'page' : undefined}
              >
                {t('nav.pricing')}
              </Link>
            </li>
          )}
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
            <ul id={menuId} className="site-nav__submenu" hidden={!open}>
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
  );
}
