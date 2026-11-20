import { Link, useLocation } from 'react-router-dom';
import { useContent } from '../content/ContentContext';
import { rememberLang, useLang, useT } from '../i18n';
import { translatePath } from '../routing/paths';
import { track } from '../analytics/track';
import type { Lang } from '../content/types';

function GlobeIcon() {
  return (
    <svg className="lang-switch__globe" viewBox="0 0 16 16" width="13" height="13" aria-hidden="true" focusable="false">
      <circle cx="8" cy="8" r="6.5" fill="none" stroke="currentColor" strokeWidth="1.1" />
      <ellipse cx="8" cy="8" rx="2.8" ry="6.5" fill="none" stroke="currentColor" strokeWidth="1.1" />
      <path d="M1.5 8h13M2.6 4.6h10.8M2.6 11.4h10.8" fill="none" stroke="currentColor" strokeWidth="1.1" />
    </svg>
  );
}

/** VI / EN switch. Each language has its own URL; the switch links to the same page in the other language. */
export function LanguageSwitcher({ tone = 'light' }: { tone?: 'light' | 'dark' }) {
  const lang = useLang();
  const t = useT();
  const { site } = useContent();
  const { pathname } = useLocation();
  const options: Lang[] = ['vi', 'en'];
  return (
    <nav className={`lang-switch lang-switch--${tone}`} aria-label={t('lang.label')}>
      <GlobeIcon />
      <ul>
        {options.map((l) => {
          const active = l === lang;
          return (
            <li key={l}>
              <Link
                to={translatePath(pathname, l, site)}
                hrefLang={l}
                lang={l}
                aria-current={active ? 'true' : undefined}
                className={active ? 'is-active' : undefined}
                onClick={() => {
                  rememberLang(l);
                  if (!active) track('language_switch', { from: lang, to: l });
                }}
              >
                {l.toUpperCase()}
                <span className="visually-hidden"> ({t(l === 'vi' ? 'lang.vi' : 'lang.en')})</span>
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
