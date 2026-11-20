import { useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useContent } from '../content/ContentContext';
import { projectsOfType, sortedTypes } from '../content/projectTypes';
import { formatPrice, hasPrices } from '../content/pricing';
import { useLang, useT } from '../i18n';
import { paths } from '../routing/paths';
import { Seo } from '../seo/Seo';
import { pageTitle } from '../seo/meta';
import { breadcrumbJsonLd } from '../seo/jsonld';
import { SiteLayout } from '../components/SiteLayout';
import { NotFoundPage } from './NotFoundPage';
import { track } from '../analytics/track';

/** /don-gia/ — price table per project category; each section is linkable as #{type-slug}. */
export function PricingPage() {
  const lang = useLang();
  const t = useT();
  const { site, projects } = useContent();
  const { hash } = useLocation();
  const pricing = site.pricing;
  const types = sortedTypes(site).filter(hasPrices);

  // Scroll to the category opened from a card link (#biet-thu).
  useEffect(() => {
    if (!hash) return;
    const el = document.getElementById(decodeURIComponent(hash.slice(1)));
    if (el) requestAnimationFrame(() => el.scrollIntoView({ block: 'start' }));
  }, [hash]);

  if (!pricing || pricing.status !== 'published') return <NotFoundPage />;
  const title = pricing.title[lang] || pricing.title.vi;
  const c = site.contact;

  return (
    <SiteLayout>
      <Seo
        lang={lang}
        title={pageTitle(site, title)}
        description={t('meta.pricing')}
        path={paths.pricing(lang)}
        alternates={{ vi: paths.pricing('vi'), en: paths.pricing('en') }}
        jsonLd={[breadcrumbJsonLd([{ name: title, path: paths.pricing(lang) }])]}
      />
      <div className="container pricing">
        <h1 className="page-title">{title}</h1>
        {pricing.intro[lang] && <p className="pricing__intro">{pricing.intro[lang]}</p>}
        {pricing.isDemo && (
          <p className="pricing__demo" role="note">
            {t('pricing.demo')}
          </p>
        )}

        {types.map((type) => {
          const typeTitle = type.title[lang] || type.title.vi;
          const visible = projectsOfType(site, projects, type.id).length > 0;
          return (
            <section key={type.id} id={type.slug[lang]} className="pricing__section" aria-labelledby={`pr-${type.id}`}>
              <h2 id={`pr-${type.id}`} className="gallery__heading">
                {typeTitle}
              </h2>
              <table className="pricing__table">
                <caption className="visually-hidden">{t('pricing.ofType', { type: typeTitle })}</caption>
                <thead>
                  <tr>
                    <th scope="col">{t('pricing.item')}</th>
                    <th scope="col">{t('pricing.rate')}</th>
                  </tr>
                </thead>
                <tbody>
                  {type.prices.map((item) => (
                    <tr key={item.id}>
                      <th scope="row">
                        {item.label[lang] || item.label.vi}
                        {item.note[lang] && <span className="pricing__note">{item.note[lang]}</span>}
                      </th>
                      <td>{formatPrice(item, lang) ?? t('pricing.contact')}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {visible && (
                <p className="pricing__more">
                  <Link to={paths.projectType(lang, type.slug[lang])}>{t('pricing.viewProjects', { type: typeTitle.toLowerCase() })}</Link>
                </p>
              )}
            </section>
          );
        })}

        {pricing.note[lang] && <p className="pricing__footnote">{pricing.note[lang]}</p>}
        <p className="pricing__cta">
          {t('pricing.cta')}{' '}
          <a href={`tel:${c.phoneE164}`} onClick={() => track('call_click', { location: 'pricing' })}>
            {c.phone}
          </a>
          {' · '}
          <a href={`mailto:${c.email}`} onClick={() => track('email_click', { location: 'pricing' })}>
            {c.email}
          </a>
        </p>
      </div>
    </SiteLayout>
  );
}
