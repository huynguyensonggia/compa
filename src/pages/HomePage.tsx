import { useState } from 'react';
import type { MouseEvent } from 'react';
import { Link } from 'react-router-dom';
import { useContent } from '../content/ContentContext';
import { useLang, useT } from '../i18n';
import { paths } from '../routing/paths';
import { Seo } from '../seo/Seo';
import { BrandLogo } from '../components/BrandLogo';
import { HeroSlideshow } from '../components/HeroSlideshow';
import { HeroVideo } from '../components/HeroVideo';
import { LanguageSwitcher } from '../components/LanguageSwitcher';
import { SocialDock } from '../components/SocialLinks';
import { RandomFadeText } from '../components/RandomFadeText';

export function HomePage() {
  const lang = useLang();
  const t = useT();
  const { site, assets } = useContent();
  const first = site.hero.slides[0];
  const firstAsset = first ? assets[first.assetId] : undefined;
  const video = site.hero.video?.src ? site.hero.video : null;
  const preload = video
    ? video.poster
      ? { src: video.poster }
      : undefined
    : firstAsset && !firstAsset.isBlob
      ? { src: firstAsset.src, srcSet: firstAsset.srcSet, sizes: '100vw' }
      : undefined;
  // With a video, the logo + texts appear only when the video reaches its final shot.
  const [revealed, setRevealed] = useState(!video);
  const [skipVideo, setSkipVideo] = useState(false);
  const show = video ? revealed : undefined;

  const skipIntro = (event: MouseEvent<HTMLDivElement>) => {
    if (!video || revealed) return;
    const target = event.target as HTMLElement;
    if (target.closest('a, button, input, select, textarea')) return;
    setSkipVideo(true);
    setRevealed(true);
  };

  return (
    <div
      className={`hero${video ? ' hero--video' : ''}${video && !revealed ? ' is-intro-pending' : ''}`}
      onClick={skipIntro}
    >
      <Seo
        lang={lang}
        title={site.seo.homeTitle[lang]}
        description={site.seo.defaultDescription[lang]}
        path={paths.home(lang)}
        alternates={{ vi: paths.home('vi'), en: paths.home('en') }}
        preloadImage={preload}
      />
      <a className="skip-link" href="#main">
        {t('skip')}
      </a>
      {video ? <HeroVideo src={video.src} poster={video.poster} endImage={video.endImage} skipRequested={skipVideo} onFinish={() => setRevealed(true)} /> : <HeroSlideshow slides={site.hero.slides} assets={assets} />}
      <div className="hero__shade" aria-hidden="true" />
      <div className="hero__lang">
        <LanguageSwitcher tone="dark" />
      </div>
      <p className="hero__eyebrow">
        <RandomFadeText text={site.brand.shortName} show={show} delay={video ? 200 : 0} order="ltr" />
      </p>
      <main id="main" className="hero__content" tabIndex={-1}>
        <h1 className="hero__logo">
          <BrandLogo variant="hero" />
        </h1>
        <p className="hero__tagline">
          <RandomFadeText text={site.brand.tagline[lang]} show={show} delay={video ? 200 : 0} order="ltr" />
        </p>
        <Link className="hero__cta" to={paths.projects(lang)}>
          <RandomFadeText text={t('home.explore')} show={show} delay={video ? 200 : 0} order="ltr" />
          <span className="visually-hidden"> {t('home.exploreTarget')}</span>
        </Link>
      </main>
      <div className="hero__social">
        <SocialDock location="home" />
      </div>
    </div>
  );
}
