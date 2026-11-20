import { useContent } from '../content/ContentContext';
import { typeCover, visibleTypes } from '../content/projectTypes';
import { useLang, useT } from '../i18n';
import { paths } from '../routing/paths';
import { Seo } from '../seo/Seo';
import { pageTitle } from '../seo/meta';
import { SiteLayout } from '../components/SiteLayout';
import { CARD_SIZES, GridCard } from '../components/ProjectCard';
import { Link } from 'react-router-dom';
import { formatPrice, lowestPrice } from '../content/pricing';

/** /du-an/ — parent categories (Biệt thự, Khách sạn, Nhà hàng, Coffee…). */
export function ProjectsPage() {
  const lang = useLang();
  const t = useT();
  const { site, projects, assets } = useContent();
  const types = visibleTypes(site, projects);
  const priceLink = (type: (typeof types)[number]['type']) => {
    const low = site.pricing?.status === 'published' ? lowestPrice(type) : null;
    const text = low ? formatPrice(low, lang) : null;
    if (!text) return undefined;
    return (
      <Link className="project-card__price" to={`${paths.pricing(lang)}#${type.slug[lang]}`}>
        {t('pricing.from', { price: text })}
      </Link>
    );
  };
  const firstCover = types[0] ? typeCover(types[0].type, types[0].projects, assets) : undefined;
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
          <ul className="project-grid">
            {types.map(({ type, projects: list }, i) => (
              <GridCard
                key={type.id}
                to={paths.projectType(lang, type.slug[lang])}
                title={type.title[lang] || type.title.vi}
                meta={list.length === 1 ? t('types.countOne') : t('types.count', { n: list.length })}
                image={typeCover(type, list, assets)}
                priority={i === 0}
                eager={i < 3}
                extra={priceLink(type)}
              />
            ))}
          </ul>
        ) : (
          <p className="empty-note">{t('projects.empty')}</p>
        )}
      </div>
    </SiteLayout>
  );
}
