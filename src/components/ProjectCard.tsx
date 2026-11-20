import type { ReactNode } from 'react';
import { Link } from 'react-router-dom';
import type { AssetMap, FocalPoint, ProjectFull, ResolvedAsset } from '../content/types';
import { useLang } from '../i18n';
import { useContent } from '../content/ContentContext';
import { projectPath } from '../content/projectTypes';
import { Picture } from './Picture';

export const CARD_SIZES = '(min-width: 1024px) 28vw, (min-width: 640px) 42vw, 90vw';

interface CardProps {
  to: string;
  title: string;
  image: ResolvedAsset | undefined;
  focalPoint?: FocalPoint;
  meta?: string;
  priority?: boolean;
  eager?: boolean;
  /** Rendered below the card link (e.g. a separate price link — links cannot be nested). */
  extra?: ReactNode;
}

/** Square image + small spaced caption, shared by type cards and project cards. */
export function GridCard({ to, title, image, focalPoint, meta, priority, eager, extra }: CardProps) {
  return (
    <li className="project-card">
      <Link to={to} className="project-card__link">
        <span className="project-card__media">
          <Picture asset={image} alt="" sizes={CARD_SIZES} priority={priority} eager={eager} focalPoint={focalPoint} />
        </span>
        <span className="project-card__title">{title}</span>
        {meta && <span className="project-card__meta">{meta}</span>}
      </Link>
      {extra}
    </li>
  );
}

interface Props {
  project: ProjectFull;
  assets: AssetMap;
  priority?: boolean;
  eager?: boolean;
}

export function ProjectCard({ project, assets, priority, eager }: Props) {
  const lang = useLang();
  const { site } = useContent();
  const to = projectPath(site, project, lang);
  if (!to) return null;
  const coverImage = project.images.find((i) => i.assetId === project.coverAssetId);
  return (
    <GridCard
      to={to}
      title={project.title[lang] || project.title.vi}
      image={project.coverAssetId ? assets[project.coverAssetId] : undefined}
      focalPoint={coverImage?.focalPoint}
      priority={priority}
      eager={eager}
    />
  );
}
