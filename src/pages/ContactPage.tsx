import { useState, type FormEvent, type ReactNode } from 'react';
import { useContent } from '../content/ContentContext';
import { useLang, useT } from '../i18n';
import type { Lang } from '../content/types';
import type { MessageKey } from '../i18n/vi';
import { paths } from '../routing/paths';
import { Seo } from '../seo/Seo';
import { pageTitle } from '../seo/meta';
import { SiteLayout } from '../components/SiteLayout';
import { Picture } from '../components/Picture';
import { track } from '../analytics/track';

const TYPES: MessageKey[] = ['contact.type1', 'contact.type2', 'contact.type3', 'contact.type4'];
const STEPS: MessageKey[] = ['contact.step1', 'contact.step2', 'contact.step3'];

const DAYS: Record<string, { vi: string; en: string }> = {
  Mo: { vi: 'Thứ Hai', en: 'Monday' },
  Tu: { vi: 'Thứ Ba', en: 'Tuesday' },
  We: { vi: 'Thứ Tư', en: 'Wednesday' },
  Th: { vi: 'Thứ Năm', en: 'Thursday' },
  Fr: { vi: 'Thứ Sáu', en: 'Friday' },
  Sa: { vi: 'Thứ Bảy', en: 'Saturday' },
  Su: { vi: 'Chủ Nhật', en: 'Sunday' },
};

/** "Mo-Sa 08:30-18:00" (schema.org openingHours) → "Thứ Hai – Thứ Bảy: 08:30 – 18:00". */
function formatHours(spec: string, lang: Lang): string {
  const m = spec.match(/^([A-Za-z,-]+)\s+(\d{1,2}:\d{2})-(\d{1,2}:\d{2})$/);
  if (!m) return spec;
  const days = m[1].replace(/[A-Z][a-z]/g, (d) => DAYS[d]?.[lang] ?? d).replace(/-/g, ' – ').replace(/,/g, ', ');
  return `${days}: ${m[2]} – ${m[3]}`;
}

const Icon = {
  phone: (
    <path d="M6.6 10.8a15.1 15.1 0 0 0 6.6 6.6l2.2-2.2a1 1 0 0 1 1-.25 11.4 11.4 0 0 0 3.6.57 1 1 0 0 1 1 1V20a1 1 0 0 1-1 1A17 17 0 0 1 3 4a1 1 0 0 1 1-1h3.5a1 1 0 0 1 1 1c0 1.25.2 2.46.57 3.6a1 1 0 0 1-.25 1z" />
  ),
  mail: (
    <>
      <rect x="3" y="5" width="18" height="14" rx="1.5" />
      <path d="m3.5 6 8.5 7 8.5-7" />
    </>
  ),
  globe: (
    <>
      <circle cx="12" cy="12" r="9" />
      <path d="M3 12h18M12 3c2.5 2.6 3.8 5.6 3.8 9s-1.3 6.4-3.8 9c-2.5-2.6-3.8-5.6-3.8-9S9.5 5.6 12 3z" />
    </>
  ),
  pin: (
    <>
      <path d="M12 21s-7-6.2-7-11.5a7 7 0 0 1 14 0C19 14.8 12 21 12 21z" />
      <circle cx="12" cy="9.5" r="2.5" />
    </>
  ),
  clock: (
    <>
      <circle cx="12" cy="12" r="9" />
      <path d="M12 7v5l3 2" />
    </>
  ),
  nav: <path d="m3 11 18-8-8 18-2-8z" />,
  arrow: <path d="M5 12h14m-5-5 5 5-5 5" />,
  external: <path d="M14 4h6v6m0-6-9 9M18 14v5a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V7a1 1 0 0 1 1-1h5" />,
};

function Svg({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" focusable="false">
      {children}
    </svg>
  );
}

export function ContactPage() {
  const lang = useLang();
  const t = useT();
  const { site, assets } = useContent();
  const c = site.contact;
  const page = site.pages.contact;
  const title = page.title[lang] || page.title.vi;
  const atelierImg = site.pages.studio.imageAssetId ? assets[site.pages.studio.imageAssetId] : undefined;
  const mapUrl = c.googleMapsPlaceUrl || `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(c.address.display.vi)}`;
  const [mapLoaded, setMapLoaded] = useState(false);
  const [types, setTypes] = useState<MessageKey[]>([]);

  const toggleType = (k: MessageKey) => setTypes((cur) => (cur.includes(k) ? cur.filter((x) => x !== k) : [...cur, k]));

  const onSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const f = new FormData(e.currentTarget);
    const get = (k: string) => String(f.get(k) ?? '').trim();
    const name = get('name');
    const lines = [
      `${t('contact.fName')}: ${name}`,
      `${t('contact.fPhone')}: ${get('phone')}`,
      `${t('contact.fSite')}: ${get('site')}`,
      `${t('contact.fType')}: ${types.map((k) => t(k)).join(', ')}`,
      '',
      `${t('contact.fNote')}:`,
      get('note'),
    ];
    track('email_click', { location: 'contact_form' });
    window.location.href = `mailto:${c.email}?subject=${encodeURIComponent(t('contact.mailSubject', { name }))}&body=${encodeURIComponent(lines.join('\n'))}`;
  };

  return (
    <SiteLayout>
      <Seo
        lang={lang}
        title={pageTitle(site, title)}
        description={t('meta.contact')}
        path={paths.contact(lang)}
        alternates={{ vi: paths.contact('vi'), en: paths.contact('en') }}
      />
      <div className="container cx">
        <header className="cx__head">
          <p className="cx__eyebrow">
            <span className="cx__dot" aria-hidden="true" />
            {site.brand.shortName} · {t('contact.eyebrow')}
          </p>
          <h1 className="cx__title">{t('contact.heading')}</h1>
          {page.intro[lang] && <p className="cx__intro">{page.intro[lang]}</p>}
        </header>

        <div className="cx__grid">
          <div className="cx__col">
            <figure className="cx__atelier">
              <Picture asset={atelierImg} alt="" sizes="(min-width: 1024px) 560px, 92vw" />
              <figcaption>
                <span className="cx__atelier-label">{t('contact.atelierLabel')}</span>
                <span>{t('contact.atelierCaption')}</span>
              </figcaption>
            </figure>

            <ul className="cx__actions">
              <li>
                <a className="cx-card" href={`tel:${c.phoneE164}`} onClick={() => track('call_click', { location: 'contact' })}>
                  <span className="cx-card__icon cx-card__icon--dark">
                    <Svg>{Icon.phone}</Svg>
                  </span>
                  <span className="cx-card__body">
                    <span className="cx-card__label">
                      {t('contact.hotline')} <span className="cx-card__badge">{t('contact.freeBadge')}</span>
                    </span>
                    <span className="cx-card__value">{c.phone}</span>
                    <span className="cx-card__note">{t('contact.hotlineNote')}</span>
                  </span>
                  <Svg className="cx-card__go">{Icon.arrow}</Svg>
                </a>
              </li>
              <li>
                <a className="cx-card" href={`mailto:${c.email}`} onClick={() => track('email_click', { location: 'contact' })}>
                  <span className="cx-card__icon">
                    <Svg>{Icon.mail}</Svg>
                  </span>
                  <span className="cx-card__body">
                    <span className="cx-card__label">{t('contact.emailLabel')}</span>
                    <span className="cx-card__value cx-card__value--mono">{c.email}</span>
                    <span className="cx-card__note">{t('contact.emailNote')}</span>
                  </span>
                  <Svg className="cx-card__go">{Icon.arrow}</Svg>
                </a>
              </li>
              {c.facebook && (
                <li>
                  <a className="cx-card" href={c.facebook} target="_blank" rel="noopener noreferrer" onClick={() => track('facebook_click', { location: 'contact' })}>
                    <span className="cx-card__icon">
                      <Svg>{Icon.globe}</Svg>
                    </span>
                    <span className="cx-card__body">
                      <span className="cx-card__label">{t('contact.fanpage')}</span>
                      <span className="cx-card__value">{site.brand.name}</span>
                    </span>
                    <Svg className="cx-card__go">{Icon.external}</Svg>
                    <span className="visually-hidden"> ({t('social.newTab')})</span>
                  </a>
                </li>
              )}
            </ul>

            <section className="cx__studio" aria-labelledby="cx-studio">
              <div className="cx__section-head">
                <h2 id="cx-studio">
                  <Svg>{Icon.pin}</Svg>
                  {t('contact.studioTitle')}
                </h2>
                <span className="cx__mono-tag">MAP · {(c.areaServed[0] ?? '').toUpperCase()}</span>
              </div>
              <div className="cx__panel">
                <p className="cx__small-label">{t('contact.hq')}</p>
                <address className="cx__address">{c.address.display[lang]}</address>

                <div className="cx__map">
                  {c.mapEmbedUrl && mapLoaded ? (
                    <iframe title={t('contact.mapTitle')} src={c.mapEmbedUrl} loading="lazy" referrerPolicy="no-referrer-when-downgrade" />
                  ) : (
                    <>
                      <span className="cx__map-art" aria-hidden="true" />
                      {c.mapEmbedUrl ? (
                        <button type="button" className="cx__map-btn" onClick={() => setMapLoaded(true)}>
                          <Svg>{Icon.nav}</Svg>
                          {t('contact.showMap')}
                        </button>
                      ) : (
                        <a className="cx__map-btn" href={mapUrl} target="_blank" rel="noopener noreferrer" onClick={() => track('directions_click', { location: 'contact' })}>
                          <Svg>{Icon.nav}</Svg>
                          {t('contact.openMap')}
                          <span className="visually-hidden"> ({t('social.newTab')})</span>
                        </a>
                      )}
                    </>
                  )}
                </div>
                {c.mapEmbedUrl && (
                  <a className="cx__directions" href={mapUrl} target="_blank" rel="noopener noreferrer" onClick={() => track('directions_click', { location: 'contact' })}>
                    {t('contact.directions')} →
                  </a>
                )}

                {c.openingHours.length > 0 && (
                  <div className="cx__hours">
                    <Svg>{Icon.clock}</Svg>
                    <div>
                      <p className="cx__small-label">{t('contact.hours')}</p>
                      {c.openingHours.map((h) => (
                        <p key={h} className="cx__hours-line">
                          {formatHours(h, lang)}
                        </p>
                      ))}
                      <p className="cx__hours-note">* {t('contact.hoursNote')}</p>
                    </div>
                  </div>
                )}
              </div>
            </section>
          </div>

          <div className="cx__col">
            <form className="cx__form" onSubmit={onSubmit}>
              <div className="cx__form-head">
                <h2>{t('contact.formTitle')}</h2>
                <span className="cx__mono-tag">FORM · 01</span>
              </div>
              <p className="cx__form-intro">{t('contact.formIntro')}</p>

              <label className="cx__field">
                <span className="cx__field-label">
                  {t('contact.fName')} <abbr title={t('contact.required')}>•</abbr>
                </span>
                <input name="name" type="text" required autoComplete="name" placeholder={t('contact.fNamePh')} />
              </label>
              <label className="cx__field">
                <span className="cx__field-label">
                  {t('contact.fPhone')} <abbr title={t('contact.required')}>•</abbr>
                </span>
                <input name="phone" type="tel" required autoComplete="tel" inputMode="tel" pattern="[0-9+ .()-]{8,}" placeholder={t('contact.fPhonePh')} />
              </label>
              <label className="cx__field">
                <span className="cx__field-label">
                  {t('contact.fSite')} <abbr title={t('contact.required')}>•</abbr>
                </span>
                <input name="site" type="text" required placeholder={t('contact.fSitePh')} />
              </label>

              <fieldset className="cx__field">
                <legend className="cx__field-label">{t('contact.fType')}</legend>
                <div className="cx__chips">
                  {TYPES.map((k) => (
                    <label key={k} className={`cx__chip${types.includes(k) ? ' is-on' : ''}`}>
                      <input type="checkbox" checked={types.includes(k)} onChange={() => toggleType(k)} />
                      {t(k)}
                    </label>
                  ))}
                </div>
              </fieldset>

              <label className="cx__field">
                <span className="cx__field-label">{t('contact.fNote')}</span>
                <textarea name="note" rows={4} placeholder={t('contact.fNotePh')} />
              </label>

              <button type="submit" className="cx__submit">
                {t('contact.submit')}
                <Svg>{Icon.arrow}</Svg>
              </button>
              <p className="cx__submit-hint">{t('contact.submitHint')}</p>
            </form>

            <section className="cx__process" aria-labelledby="cx-process">
              <h2 id="cx-process" className="cx__small-label">
                {t('contact.processTitle')}
              </h2>
              <ol>
                {STEPS.map((k, i) => (
                  <li key={k}>
                    <span className="cx__step-no">{String(i + 1).padStart(2, '0')}.</span>
                    <span>{t(k)}</span>
                  </li>
                ))}
              </ol>
            </section>
          </div>
        </div>
      </div>
    </SiteLayout>
  );
}
