import { useEffect } from 'react';
import { Navigate, useParams } from 'react-router-dom';
import { useContent } from '../content/ContentContext';
import { projectPath, typeBySlug, typeOfProject } from '../content/projectTypes';
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
  const { typeSlug = '', slug = '' } = useParams();
  const lang = useLang();
  const { site, projects, assets } = useContent();
  const project = projects.find((p) => p.slug === slug && p.status === 'published');
  const type = project ? typeOfProject(site, project) : undefined;

  useEffect(() => {
    if (project && type) track('project_view', { slug: project.slug, type: type.slug.vi, location: 'project' });
  }, [project?.slug, type?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  if (!project || !type) return <NotFoundPage />;
  // Same project reached under another type slug → canonical URL.
  if (typeBySlug(site, lang, typeSlug)?.id !== type.id) return <Navigate to={projectPath(site, project, lang)!} replace />;

  const description = projectDescription(site, project, lang);
  const ogImagePath = ogProjectPath(project.slug);
  return (
    <SiteLayout>
      <Seo
        lang={lang}
        title={projectTitle(site, project, lang)}
        description={description}
        path={paths.project(lang, type.slug[lang], project.slug)}
        alternates={{ vi: paths.project('vi', type.slug.vi, project.slug), en: paths.project('en', type.slug.en, project.slug) }}
        ogImagePath={ogImagePath}
        ogType="article"
        jsonLd={projectJsonLd(project, type, lang, description, ogImagePath)}
      />
      <ProjectDetailView project={project} assets={assets} site={site} />
    </SiteLayout>
  );
}
