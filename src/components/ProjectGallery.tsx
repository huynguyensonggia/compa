import { useRef, useState } from 'react';
import type { AssetMap } from '../content/types';
import type { GallerySection } from '../content/resolve';
import { useLang, useT } from '../i18n';
import { Picture } from './Picture';
import { Lightbox } from './Lightbox';
import { Reveal } from './useReveal';

interface Props {
  sections: GallerySection[];
  assets: AssetMap;
}

/** Gallery split into space groups; each group starts on a new row with its own heading and grid. */
export function ProjectGallery({ sections, assets }: Props) {
  const lang = useLang();
  const t = useT();
  const [open, setOpen] = useState<{ s: number; i: number } | null>(null);
  const triggerRef = useRef<HTMLButtonElement | null>(null);

  const close = () => {
    setOpen(null);
    // Return focus to the thumbnail that opened the lightbox.
    requestAnimationFrame(() => triggerRef.current?.focus());
  };

  const active = open ? sections[open.s] : null;

  return (
    <div className="gallery">
      {sections.map((section, s) => {
        const title = section.group.title[lang] || section.group.title.vi;
        return (
          <Reveal as="section" key={section.group.id} className="gallery__section" aria-labelledby={`g-${section.group.id}`} threshold={0.05}>
            <h2 id={`g-${section.group.id}`} className="gallery__heading">
              {title}
              <span className="gallery__count">{section.images.length}</span>
            </h2>
            <ul className="gallery__grid">
              {section.images.map((img, i) => (
                <li key={img.id} className="gallery__item">
                  <button
                    type="button"
                    className="gallery__thumb"
                    aria-label={`${t('project.openImage', { n: i + 1, group: title })}: ${img.alt[lang] || img.alt.vi}`}
                    onClick={(e) => {
                      triggerRef.current = e.currentTarget;
                      setOpen({ s, i });
                    }}
                  >
                    <Picture
                      asset={assets[img.assetId]}
                      alt={img.alt[lang] || img.alt.vi}
                      sizes="(min-width: 1024px) 22vw, (min-width: 640px) 45vw, 92vw"
                      focalPoint={img.focalPoint}
                    />
                  </button>
                </li>
              ))}
            </ul>
          </Reveal>
        );
      })}
      {open && active && (
        <Lightbox
          groupTitle={active.group.title[lang] || active.group.title.vi}
          images={active.images}
          index={open.i}
          assets={assets}
          onIndexChange={(i) => setOpen({ s: open.s, i })}
          onClose={close}
        />
      )}
    </div>
  );
}
