import { Link } from 'react-router-dom';
import { useContent } from '../content/ContentContext';
import { useLang, useT } from '../i18n';
import { paths } from '../routing/paths';
import { track } from '../analytics/track';
import { SocialBubbles, SocialTextLinks } from './SocialLinks';

/** Lucide icons (MIT) inlined as SVG — map-pin, phone, mail. Decorative: the text carries the meaning. */
function ContactIcon({ kind }: { kind: 'address' | 'phone' | 'email' }) {
  return (
    <svg className="site-footer__icon" viewBox="0 0 24 24" aria-hidden="true" focusable="false">
      {kind === 'address' && (
        <>
          <path d="M20 10c0 4.993-5.539 10.193-7.399 11.799a1 1 0 0 1-1.202 0C9.539 20.193 4 14.993 4 10a8 8 0 0 1 16 0" />
          <circle cx="12" cy="10" r="3" />
        </>
      )}
      {kind === 'phone' && (
        <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" />
      )}
      {kind === 'email' && (
        <>
          <rect width="20" height="16" x="2" y="4" rx="2" />
          <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
        </>
      )}
    </svg>
  );
}

/** Official logo from the project's brand assets (no redrawing). Decorative here: the name is written next to it. */
function FooterLogo() {
  const { site, assets } = useContent();
  const { brand } = site;
  const uploaded = brand.logoAssetId ? assets[brand.logoAssetId] : undefined;
  if (uploaded?.src) return <img className="site-footer__logo" src={uploaded.src} alt="" width={uploaded.width} height={uploaded.height} loading="lazy" />;
  if (brand.logoOnPhotoFile) return <img className="site-footer__logo" src={brand.logoOnPhotoFile} alt="" width={960} height={304} loading="lazy" />;
  if (brand.logoFile) return <img className="site-footer__logo" src={brand.logoFile} alt="" width={640} height={640} loading="lazy" />;
  return null;
}

export function SiteFooter() {
  const { site } = useContent();
  const lang = useLang();
  const t = useT();
  const c = site.contact;
  const year = new Date().getFullYear();
  const address = <span>{c.address.display[lang]}</span>;

  return (
    <footer className="site-footer">
      <div className="site-footer__inner">
        <div className="site-footer__col site-footer__brand">
          <FooterLogo />
          <p className="site-footer__name">{site.brand.name}</p>
          <p className="site-footer__tagline">{site.brand.tagline[lang]}</p>
          <SocialBubbles location="footer" />
        </div>

        <div className="site-footer__col">
          <h2 className="site-footer__title">{t('footer.contact')}</h2>
          <address className="site-footer__list">
            {/* Maps link only once a verified Google Maps place URL is configured. */}
            {c.googleMapsPlaceUrl ? (
              <a
                className="site-footer__row"
                href={c.googleMapsPlaceUrl}
                target="_blank"
                rel="noopener noreferrer"
                onClick={() => track('directions_click', { location: 'footer' })}
              >
                <ContactIcon kind="address" />
                {address}
              </a>
            ) : (
              <span className="site-footer__row">
                <ContactIcon kind="address" />
                {address}
              </span>
            )}
            <a className="site-footer__row" href={`tel:${c.phoneE164}`} onClick={() => track('call_click', { location: 'footer' })}>
              <ContactIcon kind="phone" />
              <span>{c.phone}</span>
            </a>
            <a className="site-footer__row" href={`mailto:${c.email}`} onClick={() => track('email_click', { location: 'footer' })}>
              <ContactIcon kind="email" />
              <span>{c.email}</span>
            </a>
          </address>
        </div>

        <nav className="site-footer__col" aria-label={t('footer.links')}>
          <h2 className="site-footer__title">{t('footer.links')}</h2>
          <div className="site-footer__links">
            <Link to={paths.projects(lang)}>{t('footer.projects')}</Link>
            <Link to={paths.studio(lang)}>{t('nav.about')}</Link>
            <Link to={paths.contact(lang)}>{t('nav.contact')}</Link>
            <SocialTextLinks location="footer" />
          </div>
        </nav>
      </div>
      <p className="site-footer__copy">
        © {year} {site.brand.name}. {t('footer.rights')}
      </p>
    </footer>
  );
}
