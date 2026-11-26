import { useEffect, useState, type MouseEvent } from 'react';
import { Link } from 'react-router-dom';
import { useContent } from '../content/ContentContext';
import { projectPath, typeCover, visibleTypes } from '../content/projectTypes';
import { formatPrice } from '../content/pricing';
import { useLang, useT } from '../i18n';
import { paths } from '../routing/paths';
import { Seo } from '../seo/Seo';
import { pageTitle } from '../seo/meta';
import { SiteLayout } from '../components/SiteLayout';
import { CARD_SIZES } from '../components/ProjectCard';
import { Picture } from '../components/Picture';
import type { Lang, ProjectType } from '../content/types';

const PROJECTS_PER_SECTION = 3;

/** Up to two priced lines of a category (shown on the right of its header). */
function headlinePrices(type: ProjectType, lang: Lang) {
  return (type.prices ?? [])
    .map((item) => ({ item, text: formatPrice(item, lang) }))
    .filter((p): p is { item: (typeof type.prices)[number]; text: string } => !!p.text)
    .slice(0, 2);
}

function priceParts(text: string) {
  const separator = text.lastIndexOf('/');
  return separator > -1
    ? { amount: text.slice(0, separator), unit: text.slice(separator) }
    : { amount: text, unit: '' };
}

/**
 * /du-an/ — category filter + one section per category (header with name, count, prices + projects).
 * "Tất cả" shows every category (up to 3 projects each); a category tab shows only that category with
 * all of its projects. The choice is kept in the URL hash (#biet-thu) so it can be shared and Back works;
 * without JavaScript the tabs are plain anchors to the sections.
 */
export function ProjectsPage() {
  const lang = useLang();
  const t = useT();
  const { site, projects, assets } = useContent();
  const types = visibleTypes(site, projects);
  const firstCover = types[0] ? typeCover(types[0].type, types[0].projects, assets) : undefined;
  const showPrices = site.pricing?.status === 'published';
  const [active, setActive] = useState<string | null>(null);

  useEffect(() => {
    const fromHash = () => {
      const slug = decodeURIComponent(window.location.hash.slice(1));
      setActive(types.some(({ type }) => type.slug[lang] === slug) ? slug : null);
    };
    fromHash();
    window.addEventListener('hashchange', fromHash);
    window.addEventListener('popstate', fromHash);
    return () => {
      window.removeEventListener('hashchange', fromHash);
      window.removeEventListener('popstate', fromHash);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lang, types.length]);

  const choose = (e: MouseEvent<HTMLAnchorElement>, slug: string | null, scrollToFilter = false) => {
    e.preventDefault();
    setActive(slug);
    const url = slug ? `#${slug}` : window.location.pathname;
    const changed = slug ? window.location.hash !== url : !!window.location.hash;
    if (changed) window.history.pushState(null, '', url);
    if (scrollToFilter) {
      const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
      document.querySelector('.project-index')?.scrollIntoView({ block: 'start', behavior: reduce ? 'auto' : 'smooth' });
    }
  };
  const shown = active ? types.filter(({ type }) => type.slug[lang] === active) : types;
  const perSection = active ? Infinity : PROJECTS_PER_SECTION;

  return (
    <SiteLayout>
      <Seo
        lang={lang}
        title={pageTitle(site, t('projects.title'))}
        description={t('meta.projects')}
        path={paths.projects(lang)}
        alternates={{ vi: paths.projects('vi'), en: paths.projects('en') }}
        preloadImage={firstCover && !firstCover.isBlob ? { src: firstCover.src, srcSet: firstCover.srcSet, sizes: CARD_SIZES } : undefined}
      />
      <div className="container">
        <h1 className="visually-hidden">{t('projects.title')}</h1>
        {types.length ? (
          <>
            <nav className="project-index" aria-label={t('types.title')}>
              <a href="#tat-ca" className={active ? undefined : 'is-active'} aria-current={active ? undefined : 'true'} onClick={(e) => choose(e, null)}>
                {t('types.all')}
              </a>
              {types.map(({ type }) => {
                const isActive = active === type.slug[lang];
                return (
                  <a
                    key={type.id}
                    href={`#${type.slug[lang]}`}
                    className={isActive ? 'is-active' : undefined}
                    aria-current={isActive ? 'true' : undefined}
                    onClick={(e) => choose(e, type.slug[lang])}
                  >
                    {type.title[lang] || type.title.vi}
                  </a>
                );
              })}
            </nav>

            <div id="tat-ca" className="project-sections" key={active ?? 'all'}>
              {shown.map(({ type, projects: list }) => {
                const typeIndex = types.findIndex((x) => x.type.id === type.id);
                const title = type.title[lang] || type.title.vi;
                const prices = showPrices ? headlinePrices(type, lang) : [];
                const description = type.description[lang]?.trim();
                return (
                  <section className="project-section" id={type.slug[lang]} key={type.id} aria-labelledby={`sec-${type.id}`}>
                    <header className="project-section__header">
                      <div className="project-section__intro">
                        <h2 id={`sec-${type.id}`} className="project-section__title">
                          <Link to={paths.projectType(lang, type.slug[lang])}>{title}</Link>
                        </h2>
                        <p className="project-section__count">
                          {list.length === 1 ? t('types.countOne') : t('types.count', { n: list.length })}
                        </p>
                        {description && <p className="project-section__description">{description}</p>}
                      </div>

                      {prices.length > 0 && (
                        <div className="project-section__pricing">
                          <dl>
                            {prices.map(({ item, text }) => {
                              const price = priceParts(text);
                              return (
                                <div key={item.id}>
                                  <dt>{item.label[lang] || item.label.vi}</dt>
                                  <dd>
                                    <span className="project-section__price-from">{t('pricing.fromShort', { price: '' }).replace(/\s{2,}/g, ' ').replace('{price}', '').trim()}</span>
                                    <span className="project-section__price-amount">{price.amount}</span>
                                    {price.unit && <span className="project-section__price-unit">{price.unit}</span>}
                                  </dd>
                                </div>
                              );
                            })}
                          </dl>
                          <Link className="project-section__more" to={`${paths.pricing(lang)}#${type.slug[lang]}`}>
                            {t('pricing.detail')}<span className="link-arrow" aria-hidden="true">→</span>
                          </Link>
                        </div>
                      )}
                    </header>

                    <ul className="project-portfolio">
                      {list.slice(0, perSection).map((project, projectIndex) => {
                        const to = projectPath(site, project, lang);
                        if (!to) return null;
                        const cover = project.coverAssetId ? assets[project.coverAssetId] : undefined;
                        const coverImage = project.images.find((i) => i.assetId === project.coverAssetId);
                        const caption = [title, project.location[lang] || project.location.vi, project.year].filter(Boolean).join(' · ');
                        return (
                          <li className="project-portfolio__item" key={project.id}>
                            <Link className="project-portfolio__link" to={to}>
                              <span className="project-portfolio__media">
                                <Picture
                                  asset={cover}
                                  alt=""
                                  sizes={CARD_SIZES}
                                  focalPoint={coverImage?.focalPoint}
                                  priority={typeIndex === 0 && projectIndex === 0}
                                  eager={typeIndex === 0}
                                />
                              </span>
                              <span className="project-portfolio__title">{project.title[lang] || project.title.vi}</span>
                              <span className="project-portfolio__meta">{caption}</span>
                            </Link>
                          </li>
                        );
                      })}
                    </ul>

                    {list.length > perSection && (
                      <p className="project-section__all">
                        {/* Opens the category filter in place; the href still points at the category page (SEO, no-JS). */}
                        <Link to={paths.projectType(lang, type.slug[lang])} onClick={(e) => choose(e, type.slug[lang], true)}>
                          {t('types.viewAll', { n: list.length, type: title.toLowerCase() })}<span className="link-arrow" aria-hidden="true">→</span></Link>
                      </p>
                    )}
                  </section>
                );
              })}
            </div>

            <section className="project-journey" aria-labelledby="journey-title">
              <h2 id="journey-title">{t('journey.title')}</h2>
              <Link to={paths.contact(lang)}>{t('journey.cta')}<span className="link-arrow" aria-hidden="true">→</span></Link>
            </section>
          </>
        ) : (
          <p className="empty-note">{t('projects.empty')}</p>
        )}
      </div>
    </SiteLayout>
  );
}
