import { Link } from 'react-router-dom';
import type { AssetMap, ProjectFull } from '../content/types';
import { gallerySections } from '../content/resolve';
import { useLang, useT } from '../i18n';
import { paths } from '../routing/paths';
import { ProjectGallery } from '../components/ProjectGallery';

/** Public project template. Also used unchanged by the admin "Xem trước" panel. */
export function ProjectDetailView({ project, assets }: { project: ProjectFull; assets: AssetMap }) {
  const lang = useLang();
  const t = useT();
  const title = project.title[lang] || project.title.vi;
  const location = project.location[lang] || project.location.vi;
  const description = project.description[lang] || project.description.vi;
  const sections = gallerySections(project);
  const sources = Array.from(
    new Set(project.images.map((i) => assets[i.assetId]).filter((a) => a?.isDemo && a.sourceUrl?.includes('unsplash')).map(() => 'Unsplash')),
  );

  return (
    <article className="container project">
      <nav className="breadcrumb" aria-label={t('breadcrumb')}>
        <ol>
          <li>
            <Link to={paths.projects(lang)}>{t('projects.title')}</Link>
          </li>
          <li aria-current="page">{title}</li>
        </ol>
      </nav>
      <header className="project__header">
        <h1 className="project__title">{title}</h1>
        <dl className="project__meta">
          {location && (
            <div>
              <dt>{t('project.location')}</dt>
              <dd>{location}</dd>
            </div>
          )}
          {project.year && (
            <div>
              <dt>{t('project.year')}</dt>
              <dd>{project.year}</dd>
            </div>
          )}
          {project.categories.length > 0 && (
            <div>
              <dt>{t('project.categories')}</dt>
              <dd>{project.categories.map((c) => t(`cat.${c}`)).join(' · ')}</dd>
            </div>
          )}
          {project.isDemo && (
            <div>
              <dt className="visually-hidden">{t('project.demo')}</dt>
              <dd className="project__demo">
                {t('project.demo')}
                {sources.length > 0 && ` · ${t('project.imageSource')}: ${sources.join(', ')}`}
              </dd>
            </div>
          )}
        </dl>
        {description && (
          <div className="project__description">
            {description.split(/\n{2,}/).map((para, i) => (
              <p key={i}>{para}</p>
            ))}
          </div>
        )}
      </header>
      <ProjectGallery sections={sections} assets={assets} />
      <p className="project__back">
        <Link to={paths.projects(lang)}>{t('project.back')}</Link>
      </p>
    </article>
  );
}
