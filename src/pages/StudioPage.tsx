import { useContent } from '../content/ContentContext';
import { useLang, useT } from '../i18n';
import { paths } from '../routing/paths';
import { Seo } from '../seo/Seo';
import { pageTitle } from '../seo/meta';
import { SiteLayout } from '../components/SiteLayout';
import { Picture } from '../components/Picture';

export function StudioPage() {
  const lang = useLang();
  const t = useT();
  const { site, assets } = useContent();
  const page = site.pages.studio;
  const img = page.imageAssetId ? assets[page.imageAssetId] : undefined;
  const title = page.title[lang] || page.title.vi;
  const body = page.body[lang] || page.body.vi;
  return (
    <SiteLayout>
      <Seo
        lang={lang}
        title={pageTitle(site, title)}
        description={t('meta.studio')}
        path={paths.studio(lang)}
        alternates={{ vi: paths.studio('vi'), en: paths.studio('en') }}
      />
      <div className="container text-page studio">
        <h1 className="page-title">{title}</h1>
        <p className="studio__tagline">{site.brand.tagline[lang]}</p>
        <div className="prose">
          {body.split(/\n{2,}/).map((p, i) => (
            <p key={i}>{p}</p>
          ))}
        </div>
        <ul className="studio__fields">
          {site.services.items.map((s) => (
            <li key={s.key}>{s.title[lang]}</li>
          ))}
        </ul>
        {img && (
          <figure className="studio__figure">
            <Picture asset={img} alt={site.brand.name} sizes="(min-width: 1024px) 900px, 92vw" />
            {img.isDemo && <figcaption>{t('studio.photoCredit')}</figcaption>}
          </figure>
        )}
      </div>
    </SiteLayout>
  );
}
