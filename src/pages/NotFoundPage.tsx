import { Link, useLocation } from 'react-router-dom';
import { useContent } from '../content/ContentContext';
import { translate } from '../i18n';
import { Seo } from '../seo/Seo';
import { paths } from '../routing/paths';
import { BrandLogo } from '../components/BrandLogo';

/** Bilingual 404 (identical markup for any URL, so the static 404.html hydrates cleanly). */
export function NotFoundPage() {
  const { site } = useContent();
  const { pathname } = useLocation();
  return (
    <div className="not-found">
      <Seo
        lang="vi"
        title={`${translate('vi', 'notFound.title')} | ${site.brand.name}`}
        description={translate('vi', 'meta.notFound')}
        path={pathname}
        noindex
      />
      <Link to="/" className="not-found__logo" aria-label={translate('vi', 'nav.home')}>
        <BrandLogo variant="header" />
      </Link>
      <main id="main" className="not-found__body">
        <h1 className="page-title">
          {translate('vi', 'notFound.title')}
          <span lang="en" className="not-found__en">
            {translate('en', 'notFound.title')}
          </span>
        </h1>
        <p>{site.pages.notFound.vi}</p>
        <p lang="en">{site.pages.notFound.en}</p>
        <p className="not-found__links">
          <Link to={paths.projects('vi')}>{translate('vi', 'notFound.cta')}</Link>
          <Link to={paths.projects('en')} lang="en">
            {translate('en', 'notFound.cta')}
          </Link>
        </p>
      </main>
    </div>
  );
}
