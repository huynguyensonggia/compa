import { Link, useParams } from 'react-router-dom';
import { useContent } from '../content/ContentContext';
import { projectsOfType, typeBySlug } from '../content/projectTypes';
import { useLang, useT } from '../i18n';
import { paths } from '../routing/paths';
import { Seo } from '../seo/Seo';
import { firstSentence, pageTitle } from '../seo/meta';
import { breadcrumbJsonLd } from '../seo/jsonld';
import { SiteLayout } from '../components/SiteLayout';
import { ProjectGrid } from '../components/ProjectGrid';
import { CARD_SIZES } from '../components/ProjectCard';
import { NotFoundPage } from './NotFoundPage';

/** /du-an/{type}/ — projects of one category. */
export function ProjectTypePage() {
  const { typeSlug = '' } = useParams();
  const lang = useLang();
  const t = useT();
  const { site, projects, assets } = useContent();
  const type = typeBySlug(site, lang, typeSlug);
  const list = type ? projectsOfType(site, projects, type.id) : [];
  if (!type || !list.length) return <NotFoundPage />;

  const title = type.title[lang] || type.title.vi;
  const description = type.description[lang] || '';
  const first = list[0]?.coverAssetId ? assets[list[0].coverAssetId] : undefined;
  return (
    <SiteLayout>
      <Seo
        lang={lang}
        title={pageTitle(site, title)}
        description={firstSentence(description) || t('meta.type', { type: title })}
        path={paths.projectType(lang, type.slug[lang])}
        alternates={{ vi: paths.projectType('vi', type.slug.vi), en: paths.projectType('en', type.slug.en) }}
        jsonLd={[
          breadcrumbJsonLd([
            { name: t('projects.title'), path: paths.projects(lang) },
            { name: title, path: paths.projectType(lang, type.slug[lang]) },
          ]),
        ]}
        preloadImage={first && !first.isBlob ? { src: first.src, srcSet: first.srcSet, sizes: CARD_SIZES } : undefined}
      />
      <div className="container">
        <nav className="breadcrumb" aria-label={t('breadcrumb')}>
          <ol>
            <li>
              <Link to={paths.projects(lang)}>{t('projects.title')}</Link>
            </li>
            <li aria-current="page">{title}</li>
          </ol>
        </nav>
        <header className="type-header">
          <h1 className="project__title">{title}</h1>
          {description && (
            <div className="project__description">
              {description.split(/\n{2,}/).map((p, i) => (
                <p key={i}>{p}</p>
              ))}
            </div>
          )}
        </header>
        <ProjectGrid projects={list} assets={assets} />
        <p className="project__back">
          <Link to={paths.projects(lang)}>{t('type.back')}</Link>
        </p>
      </div>
    </SiteLayout>
  );
}
