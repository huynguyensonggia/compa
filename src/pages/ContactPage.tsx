import { useState } from 'react';
import { useContent } from '../content/ContentContext';
import { useLang, useT } from '../i18n';
import { paths } from '../routing/paths';
import { Seo } from '../seo/Seo';
import { pageTitle } from '../seo/meta';
import { SiteLayout } from '../components/SiteLayout';
import { track } from '../analytics/track';

export function ContactPage() {
  const lang = useLang();
  const t = useT();
  const { site } = useContent();
  const c = site.contact;
  const page = site.pages.contact;
  const [mapLoaded, setMapLoaded] = useState(false);
  const title = page.title[lang] || page.title.vi;
  return (
    <SiteLayout>
      <Seo
        lang={lang}
        title={pageTitle(site, title)}
        description={t('meta.contact')}
        path={paths.contact(lang)}
        alternates={{ vi: paths.contact('vi'), en: paths.contact('en') }}
      />
      <div className="container text-page contact">
        <h1 className="page-title">{title}</h1>
        {page.intro[lang] && <p className="contact__intro">{page.intro[lang]}</p>}
        <dl className="contact__list">
          <div>
            <dt>{t('contact.phone')}</dt>
            <dd>
              <a href={`tel:${c.phoneE164}`} onClick={() => track('call_click', { location: 'contact' })}>
                {c.phone}
              </a>
            </dd>
          </div>
          <div>
            <dt>{t('contact.email')}</dt>
            <dd>
              <a href={`mailto:${c.email}`} onClick={() => track('email_click', { location: 'contact' })}>
                {c.email}
              </a>
            </dd>
          </div>
          <div>
            <dt>{t('contact.address')}</dt>
            <dd>
              <address>{c.address.display[lang]}</address>
            </dd>
          </div>
          {c.facebook && (
            <div>
              <dt>{t('contact.facebook')}</dt>
              <dd>
                <a href={c.facebook} target="_blank" rel="noopener noreferrer" onClick={() => track('facebook_click', { location: 'contact' })}>
                  {c.facebook.replace(/^https?:\/\/(www\.)?/, '')}
                </a>
              </dd>
            </div>
          )}
        </dl>
        {c.googleMapsPlaceUrl && (
          <p>
            <a
              className="button-outline"
              href={c.googleMapsPlaceUrl}
              target="_blank"
              rel="noopener noreferrer"
              onClick={() => track('directions_click', { location: 'contact' })}
            >
              {t('contact.directions')}
            </a>
          </p>
        )}
        {c.mapEmbedUrl && (
          <div className="contact__map">
            {mapLoaded ? (
              <iframe title={t('contact.mapTitle')} src={c.mapEmbedUrl} loading="lazy" referrerPolicy="no-referrer-when-downgrade" />
            ) : (
              <button type="button" className="button-outline" onClick={() => setMapLoaded(true)}>
                {t('contact.showMap')}
              </button>
            )}
          </div>
        )}
      </div>
    </SiteLayout>
  );
}
