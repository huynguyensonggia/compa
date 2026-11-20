import { Link } from 'react-router-dom';
import { useContent } from '../content/ContentContext';
import { useLang, useT } from '../i18n';
import { paths } from '../routing/paths';
import { track } from '../analytics/track';
import { SocialTextLinks } from './SocialLinks';

/** Decorative line icons (the text next to them carries the meaning). */
function ContactIcon({ kind }: { kind: 'address' | 'phone' | 'email' }) {
  return (
    <svg className="site-footer__icon" viewBox="0 0 24 24" width="16" height="16" aria-hidden="true" focusable="false">
      {kind === 'address' && (
        <>
          <path d="M12 21s-6.5-5.6-6.5-11a6.5 6.5 0 0 1 13 0C18.5 15.4 12 21 12 21z" />
          <circle cx="12" cy="10" r="2.3" />
        </>
      )}
      {kind === 'phone' && (
        <path d="M6.6 3.5h2.8l1.4 4.1-2 1.3a11.5 11.5 0 0 0 6.3 6.3l1.3-2 4.1 1.4v2.8a1.6 1.6 0 0 1-1.7 1.6A16.3 16.3 0 0 1 5 5.2a1.6 1.6 0 0 1 1.6-1.7z" />
      )}
      {kind === 'email' && (
        <>
          <rect x="3" y="5.5" width="18" height="13" rx="1.5" />
          <path d="M3.5 6.5l8.5 6.5 8.5-6.5" />
        </>
      )}
    </svg>
  );
}

export function SiteFooter() {
  const { site } = useContent();
  const lang = useLang();
  const t = useT();
  const c = site.contact;
  const year = new Date().getFullYear();
  return (
    <footer className="site-footer">
      <div className="site-footer__inner">
        <div className="site-footer__brand">
          <span className="site-footer__mark" aria-hidden="true">
            {site.brand.logoText}
          </span>
          <p className="site-footer__name">{site.brand.name}</p>
          <p className="site-footer__tagline">{site.brand.tagline[lang]}</p>
        </div>
        <address className="site-footer__contact">
          <span className="site-footer__row">
            <ContactIcon kind="address" />
            <span>{c.address.display[lang]}</span>
          </span>
          <a className="site-footer__row" href={`tel:${c.phoneE164}`} onClick={() => track('call_click', { location: 'footer' })}>
            <ContactIcon kind="phone" />
            <span>{c.phone}</span>
          </a>
          <a className="site-footer__row" href={`mailto:${c.email}`} onClick={() => track('email_click', { location: 'footer' })}>
            <ContactIcon kind="email" />
            <span>{c.email}</span>
          </a>
        </address>
        <div className="site-footer__links">
          <Link to={paths.contact(lang)}>{t('footer.contact')}</Link>
          <SocialTextLinks location="footer" />
        </div>
      </div>
      <p className="site-footer__copy">
        © {year} {site.brand.name}. {t('footer.rights')}
      </p>
    </footer>
  );
}
