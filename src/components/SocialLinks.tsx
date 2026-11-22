import type { SiteContent } from '../content/types';
import { useContent } from '../content/ContentContext';
import { useT } from '../i18n';
import { track, type TrackEvent } from '../analytics/track';

export type SocialKey = 'facebook' | 'instagram' | 'tiktok';

interface SocialDef {
  key: SocialKey;
  label: string;
  event: TrackEvent;
  icon: JSX.Element;
}

const ICONS: SocialDef[] = [
  {
    key: 'facebook',
    label: 'Facebook',
    event: 'facebook_click',
    icon: (
      <path d="M16 8.049c0-4.446-3.582-8.05-8-8.05C3.58 0-.002 3.603-.002 8.05c0 4.017 2.926 7.347 6.75 7.951v-5.625h-2.03V8.05H6.75V6.275c0-2.017 1.195-3.131 3.022-3.131.876 0 1.791.157 1.791.157v1.98h-1.009c-.993 0-1.303.621-1.303 1.258v1.51h2.218l-.354 2.326H9.25V16c3.824-.604 6.75-3.934 6.75-7.951z" />
    ),
  },
  {
    key: 'instagram',
    label: 'Instagram',
    event: 'instagram_click',
    icon: (
      <path d="M8 0C5.829 0 5.556.01 4.703.048 3.85.088 3.269.222 2.76.42a3.917 3.917 0 0 0-1.417.923A3.927 3.927 0 0 0 .42 2.76C.222 3.268.087 3.85.048 4.7.01 5.555 0 5.827 0 8.001c0 2.172.01 2.444.048 3.297.04.852.174 1.433.372 1.942.205.526.478.972.923 1.417.444.445.89.719 1.416.923.51.198 1.09.333 1.942.372C5.555 15.99 5.827 16 8 16s2.444-.01 3.298-.048c.851-.04 1.434-.174 1.943-.372a3.916 3.916 0 0 0 1.416-.923c.445-.445.718-.891.923-1.417.197-.509.332-1.09.372-1.942C15.99 10.445 16 10.173 16 8s-.01-2.445-.048-3.299c-.04-.851-.175-1.433-.372-1.941a3.926 3.926 0 0 0-.923-1.417A3.911 3.911 0 0 0 13.24.42c-.51-.198-1.092-.333-1.943-.372C10.443.01 10.172 0 7.998 0h.003zm-.717 1.442h.718c2.136 0 2.389.007 3.232.046.78.035 1.204.166 1.486.275.373.145.64.319.92.599.28.28.453.546.598.92.11.281.24.705.275 1.485.039.843.047 1.096.047 3.231s-.008 2.389-.047 3.232c-.035.78-.166 1.203-.275 1.485a2.47 2.47 0 0 1-.599.919c-.28.28-.546.453-.92.598-.28.11-.704.24-1.485.276-.843.038-1.096.047-3.232.047s-2.39-.009-3.233-.047c-.78-.036-1.203-.166-1.485-.276a2.478 2.478 0 0 1-.92-.598 2.48 2.48 0 0 1-.6-.92c-.109-.281-.24-.705-.275-1.485-.038-.843-.046-1.096-.046-3.233 0-2.136.008-2.388.046-3.231.036-.78.166-1.204.276-1.486.145-.373.319-.64.599-.92.28-.28.546-.453.92-.598.282-.11.705-.24 1.485-.276.738-.034 1.024-.044 2.515-.045v.002zm4.988 1.328a.96.96 0 1 0 0 1.92.96.96 0 0 0 0-1.92zm-4.27 1.122a4.109 4.109 0 1 0 0 8.217 4.109 4.109 0 0 0 0-8.217zm0 1.441a2.667 2.667 0 1 1 0 5.334 2.667 2.667 0 0 1 0-5.334z" />
    ),
  },
  {
    key: 'tiktok',
    label: 'TikTok',
    event: 'tiktok_click',
    icon: <path d="M9 0h1.98c.144.715.54 1.617 1.235 2.512C12.895 3.389 13.797 4 15 4v2c-1.753 0-3.07-.814-4-1.829V11a5 5 0 1 1-5-5v2a3 3 0 1 0 3 3V0Z" />,
  },
];

/** Social accounts that have a URL configured (unverified accounts stay empty → hidden). */
export function configuredSocials(site: SiteContent) {
  return ICONS.map((d) => ({ ...d, url: site.contact[d.key]?.trim() ?? '' })).filter((d) => d.url);
}

/**
 * Row of square icon buttons (home hero): dark tiles that switch to the brand colour on hover,
 * with the icon sliding in from the top. All three are always shown; a button without a URL yet
 * is rendered as a non-link placeholder (no dead link) until the URL is entered in admin.
 */
export function SocialDock({ location }: { location: string }) {
  const { site } = useContent();
  const t = useT();
  return (
    <nav className="social-card" aria-label={t('social.label')}>
      {ICONS.map((s) => {
        const url = site.contact[s.key]?.trim() ?? '';
        const className = `social-card__item social-card__item--${s.key}`;
        const svg = (
          <svg className="social-card__svg" viewBox="0 0 16 16" aria-hidden="true" focusable="false">
            {s.icon}
          </svg>
        );
        if (!url) {
          return (
            <span key={s.key} className={`${className} is-pending`} role="img" aria-label={`${s.label} — ${t('social.pending')}`} title={t('social.pending')}>
              {svg}
            </span>
          );
        }
        return (
          <a key={s.key} className={className} href={url} target="_blank" rel="noopener noreferrer" onClick={() => track(s.event, { location })}>
            {svg}
            <span className="visually-hidden">
              {s.label} — {t('social.newTab')}
            </span>
          </a>
        );
      })}
    </nav>
  );
}

/** Plain text links (footer / contact). */
export function SocialTextLinks({ location, className }: { location: string; className?: string }) {
  const { site } = useContent();
  return (
    <>
      {configuredSocials(site).map((s) => (
        <a key={s.key} className={className} href={s.url} target="_blank" rel="noopener noreferrer" onClick={() => track(s.event, { location })}>
          {s.label}
        </a>
      ))}
    </>
  );
}

/*
 * From Uiverse.io by david-mohseni - https://uiverse.io/david-mohseni/brave-shrimp-86
 * MIT License, Copyright (c) david-mohseni (David Mohseni)
 *
 * Adapted: round icon buttons with a pop-up tooltip and bouncy hover (look and animation kept),
 * Facebook / Instagram / TikTok, COMPA sand resting colour, scoped class names, real links.
 * A button without a URL yet is a non-link placeholder (same look, no dead link).
 */
export function SocialBubbles({ location }: { location: string }) {
  const { site } = useContent();
  const t = useT();
  return (
    <ul className="social-bubbles" aria-label={t('social.label')}>
      {ICONS.map((s) => {
        const url = site.contact[s.key]?.trim() ?? '';
        const className = `social-bubbles__item social-bubbles__item--${s.key}`;
        const content = (
          <>
            <span className="social-bubbles__tooltip" aria-hidden="true">
              {s.label}
            </span>
            <svg viewBox="0 0 16 16" height="1.2em" fill="currentColor" aria-hidden="true" focusable="false">
              {s.icon}
            </svg>
          </>
        );
        return (
          <li key={s.key}>
            {url ? (
              <a className={className} href={url} target="_blank" rel="noopener noreferrer" onClick={() => track(s.event, { location })}>
                {content}
                <span className="visually-hidden">
                  {s.label} — {t('social.newTab')}
                </span>
              </a>
            ) : (
              <span className={`${className} is-pending`} role="img" aria-label={`${s.label} — ${t('social.pending')}`}>
                {content}
              </span>
            )}
          </li>
        );
      })}
    </ul>
  );
}
