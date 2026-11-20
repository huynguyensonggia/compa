import { useId } from 'react';
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
      <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
    ),
  },
  {
    key: 'instagram',
    label: 'Instagram',
    event: 'instagram_click',
    icon: (
      <>
        <rect x="2.5" y="2.5" width="19" height="19" rx="5.5" fill="none" stroke="currentColor" strokeWidth="2" />
        <circle cx="12" cy="12" r="4.3" fill="none" stroke="currentColor" strokeWidth="2" />
        <circle cx="17.6" cy="6.4" r="1.3" />
      </>
    ),
  },
  {
    key: 'tiktok',
    label: 'TikTok',
    event: 'tiktok_click',
    icon: (
      <path d="M12.525.02c1.31-.02 2.61-.01 3.91-.02.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.05-2.89-.35-4.2-.97-.57-.26-1.1-.59-1.62-.93-.01 2.92.01 5.84-.02 8.75-.08 1.4-.54 2.79-1.35 3.94-1.31 1.92-3.58 3.17-5.91 3.21-1.43.08-2.86-.31-4.08-1.03-2.02-1.19-3.44-3.37-3.65-5.71-.02-.5-.03-1-.01-1.49.18-1.9 1.12-3.72 2.58-4.96 1.66-1.44 3.98-2.13 6.15-1.72.02 1.48-.04 2.96-.04 4.44-.99-.32-2.15-.23-3.02.37-.63.41-1.11 1.04-1.36 1.75-.21.51-.15 1.07-.14 1.61.24 1.64 1.82 3.02 3.5 2.87 1.12-.01 2.19-.66 2.77-1.61.19-.33.4-.67.41-1.06.1-1.79.06-3.57.07-5.36.01-4.03-.01-8.05.02-12.07z" />
    ),
  },
];

/** Social accounts that have a URL configured (unverified accounts stay empty → hidden). */
export function configuredSocials(site: SiteContent) {
  return ICONS.map((d) => ({ ...d, url: site.contact[d.key]?.trim() ?? '' })).filter((d) => d.url);
}

/**
 * Frosted dock of squircle icon buttons that lift on hover/focus (home hero).
 * Renders only the accounts with a configured URL.
 */
export function SocialDock({ location }: { location: string }) {
  const { site } = useContent();
  const t = useT();
  const clipId = `squircle-${useId().replace(/:/g, '')}`;
  const items = configuredSocials(site);
  if (!items.length) return null;
  return (
    <nav className="social-dock" aria-label={t('social.label')}>
      <svg width="0" height="0" className="social-dock__defs" aria-hidden="true" focusable="false">
        <defs>
          <clipPath id={clipId} clipPathUnits="objectBoundingBox">
            <path d="M 0,0.5 C 0,0 0,0 0.5,0 S 1,0 1,0.5 1,1 0.5,1 0,1 0,0.5" />
          </clipPath>
        </defs>
      </svg>
      <ul className="social-dock__list">
        {items.map((s) => (
          <li key={s.key}>
            <a
              className={`social-dock__item social-dock__item--${s.key}`}
              href={s.url}
              target="_blank"
              rel="noopener noreferrer"
              onClick={() => track(s.event, { location })}
            >
              <span className="social-dock__tile" style={{ clipPath: `url(#${clipId})` }}>
                <svg viewBox="0 0 24 24" fill="currentColor" width="30" height="30" aria-hidden="true" focusable="false">
                  {s.icon}
                </svg>
              </span>
              <span className="visually-hidden">
                {s.label} — {t('social.newTab')}
              </span>
            </a>
          </li>
        ))}
      </ul>
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
