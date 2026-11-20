import { Link, useParams } from 'react-router-dom';
import { useContent } from '../content/ContentContext';
import { publishedProjects } from '../content/resolve';
import { useLang, useT } from '../i18n';
import { paths } from '../routing/paths';
import { Seo } from '../seo/Seo';
import { firstSentence, pageTitle } from '../seo/meta';
import { SiteLayout } from '../components/SiteLayout';
import { ProjectGrid } from '../components/ProjectGrid';
import { NotFoundPage } from './NotFoundPage';

/** /dich-vu/ — only public once the client has supplied and published the content. */
export function ServicesPage() {
  const lang = useLang();
  const t = useT();
  const { site } = useContent();
  const svc = site.services;
  if (svc.status !== 'published') return <NotFoundPage />;
  const title = svc.title[lang] || svc.title.vi;
  const items = svc.items.filter((s) => s.status === 'published');
  return (
    <SiteLayout>
      <Seo
        lang={lang}
        title={pageTitle(site, title)}
        description={firstSentence(svc.intro[lang]) || t('meta.services')}
        path={paths.services(lang)}
        alternates={{ vi: paths.services('vi'), en: paths.services('en') }}
      />
      <div className="container text-page">
        <h1 className="page-title">{title}</h1>
        {svc.intro[lang] && (
          <div className="prose">
            {svc.intro[lang].split(/\n{2,}/).map((p, i) => (
              <p key={i}>{p}</p>
            ))}
          </div>
        )}
        <ul className="service-list">
          {items.map((s) => (
            <li key={s.key}>
              <Link to={paths.service(lang, s.slug[lang])}>{s.title[lang]}</Link>
            </li>
          ))}
        </ul>
      </div>
    </SiteLayout>
  );
}

export function ServiceDetailPage() {
  const { slug = '' } = useParams();
  const lang = useLang();
  const t = useT();
  const { site, projects, assets } = useContent();
  const item = site.services.items.find((s) => s.slug[lang] === slug);
  if (!item || item.status !== 'published' || site.services.status !== 'published') return <NotFoundPage />;
  const related = publishedProjects(projects)
    .filter((p) => p.categories.includes(item.key))
    .slice(0, 6);
  const body = item.body[lang] || '';
  return (
    <SiteLayout>
      <Seo
        lang={lang}
        title={pageTitle(site, item.title[lang])}
        description={firstSentence(body) || t('meta.services')}
        path={paths.service(lang, item.slug[lang])}
        alternates={{ vi: paths.service('vi', item.slug.vi), en: paths.service('en', item.slug.en) }}
      />
      <div className="container">
        <nav className="breadcrumb" aria-label={t('breadcrumb')}>
          <ol>
            <li>
              <Link to={paths.services(lang)}>{site.services.title[lang]}</Link>
            </li>
            <li aria-current="page">{item.title[lang]}</li>
          </ol>
        </nav>
        <div className="text-page text-page--flush">
          <h1 className="page-title">{item.title[lang]}</h1>
          <div className="prose">
            {body.split(/\n{2,}/).map((p, i) => (
              <p key={i}>{p}</p>
            ))}
          </div>
        </div>
        {related.length > 0 && (
          <section className="service-projects" aria-labelledby="svc-projects">
            <h2 id="svc-projects" className="section-label">
              {t('services.projects')}
            </h2>
            <ProjectGrid projects={related} assets={assets} eager={0} />
            <p className="project__back">
              <Link to={paths.projects(lang)}>{t('services.viewAll')}</Link>
            </p>
          </section>
        )}
      </div>
    </SiteLayout>
  );
}
