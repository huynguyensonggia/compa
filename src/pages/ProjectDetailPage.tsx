import { useEffect } from 'react';
import { Navigate, useParams } from 'react-router-dom';
import { useContent } from '../content/ContentContext';
import { useLang } from '../i18n';
import { paths } from '../routing/paths';
import { Seo } from '../seo/Seo';
import { projectDescription, projectTitle } from '../seo/meta';
import { projectJsonLd } from '../seo/jsonld';
import { ogProjectPath } from '../seo/config';
import { SiteLayout } from '../components/SiteLayout';
import { ProjectDetailView } from './ProjectDetailView';
import { NotFoundPage } from './NotFoundPage';
import { track } from '../analytics/track';

export function ProjectDetailPage() {
  const { slug = '' } = useParams();
  const lang = useLang();
  const { site, projects, assets, redirects } = useContent();
  const project = projects.find((p) => p.slug === slug && p.status === 'published');

  useEffect(() => {
    if (project) track('project_view', { slug: project.slug, location: 'project' });
  }, [project?.slug]); // eslint-disable-line react-hooks/exhaustive-deps

  if (!project) {
    // In production the static host answers old slugs with a 301 from _redirects; this covers local mode.
    const moved = redirects.find((r) => r.from === slug);
    if (moved) return <Navigate to={paths.project(lang, moved.to)} replace />;
    return <NotFoundPage />;
  }

  const description = projectDescription(site, project, lang);
  const ogImagePath = ogProjectPath(project.slug);
  return (
    <SiteLayout>
      <Seo
        lang={lang}
        title={projectTitle(site, project, lang)}
        description={description}
        path={paths.project(lang, project.slug)}
        alternates={{ vi: paths.project('vi', project.slug), en: paths.project('en', project.slug) }}
        ogImagePath={ogImagePath}
        ogType="article"
        jsonLd={projectJsonLd(project, lang, description, ogImagePath)}
      />
      <ProjectDetailView project={project} assets={assets} />
    </SiteLayout>
  );
}
