import { Link } from 'react-router-dom';
import { useContent } from '../content/ContentContext';
import { useLang, useT } from '../i18n';
import { paths } from '../routing/paths';
import { track } from '../analytics/track';

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
          <span>{c.address.display[lang]}</span>
          <a href={`tel:${c.phoneE164}`} onClick={() => track('call_click', { location: 'footer' })}>
            {c.phone}
          </a>
          <a href={`mailto:${c.email}`} onClick={() => track('email_click', { location: 'footer' })}>
            {c.email}
          </a>
        </address>
        <div className="site-footer__links">
          <Link to={paths.contact(lang)}>{t('footer.contact')}</Link>
          {c.facebook && (
            <a href={c.facebook} target="_blank" rel="noopener noreferrer" onClick={() => track('facebook_click', { location: 'footer' })}>
              Facebook
            </a>
          )}
        </div>
      </div>
      <p className="site-footer__copy">
        © {year} {site.brand.name}. {t('footer.rights')}
      </p>
    </footer>
  );
}
