import { useContent } from '../content/ContentContext';
import { publishedProjects } from '../content/resolve';
import { useLang, useT } from '../i18n';
import { paths } from '../routing/paths';
import { Seo } from '../seo/Seo';
import { pageTitle } from '../seo/meta';
import { SiteLayout } from '../components/SiteLayout';
import { ProjectGrid } from '../components/ProjectGrid';
import { CARD_SIZES } from '../components/ProjectCard';

export function ProjectsPage() {
  const lang = useLang();
  const t = useT();
  const { site, projects, assets } = useContent();
  const list = publishedProjects(projects);
  const firstCover = list[0]?.coverAssetId ? assets[list[0].coverAssetId] : undefined;
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
        {list.length ? <ProjectGrid projects={list} assets={assets} /> : <p className="empty-note">{t('projects.empty')}</p>}
      </div>
    </SiteLayout>
  );
}
