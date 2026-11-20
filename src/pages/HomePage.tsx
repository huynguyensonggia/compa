import { Link } from 'react-router-dom';
import { useContent } from '../content/ContentContext';
import { useLang, useT } from '../i18n';
import { paths } from '../routing/paths';
import { Seo } from '../seo/Seo';
import { BrandLogo } from '../components/BrandLogo';
import { HeroSlideshow } from '../components/HeroSlideshow';
import { LanguageSwitcher } from '../components/LanguageSwitcher';
import { track } from '../analytics/track';

export function HomePage() {
  const lang = useLang();
  const t = useT();
  const { site, assets } = useContent();
  const first = site.hero.slides[0];
  const firstAsset = first ? assets[first.assetId] : undefined;

  return (
    <div className="hero">
      <Seo
        lang={lang}
        title={site.seo.homeTitle[lang]}
        description={site.seo.defaultDescription[lang]}
        path={paths.home(lang)}
        alternates={{ vi: paths.home('vi'), en: paths.home('en') }}
        preloadImage={firstAsset && !firstAsset.isBlob ? { src: firstAsset.src, srcSet: firstAsset.srcSet, sizes: '100vw' } : undefined}
      />
      <a className="skip-link" href="#main">
        {t('skip')}
      </a>
      <HeroSlideshow slides={site.hero.slides} assets={assets} />
      <div className="hero__shade" aria-hidden="true" />
      <div className="hero__lang">
        <LanguageSwitcher tone="dark" />
      </div>
      <p className="hero__eyebrow">{site.brand.shortName}</p>
      <main id="main" className="hero__content" tabIndex={-1}>
        <h1 className="hero__logo">
          <BrandLogo variant="hero" />
        </h1>
        <p className="hero__tagline">{site.brand.tagline[lang]}</p>
        <Link className="hero__cta" to={paths.projects(lang)}>
          {t('home.explore')}
        </Link>
      </main>
      {site.contact.facebook && (
        <div className="hero__social">
          <a
            href={site.contact.facebook}
            target="_blank"
            rel="noopener noreferrer"
            onClick={() => track('facebook_click', { location: 'home' })}
          >
            Facebook
          </a>
        </div>
      )}
    </div>
  );
}
