import { Link } from 'react-router-dom';
import type { AssetMap, ProjectFull } from '../content/types';
import { useLang } from '../i18n';
import { paths } from '../routing/paths';
import { Picture } from './Picture';

interface Props {
  project: ProjectFull;
  assets: AssetMap;
  priority?: boolean;
  eager?: boolean;
}

export const CARD_SIZES = '(min-width: 1024px) 28vw, (min-width: 640px) 42vw, 90vw';

export function ProjectCard({ project, assets, priority, eager }: Props) {
  const lang = useLang();
  const title = project.title[lang] || project.title.vi;
  const cover = project.coverAssetId ? assets[project.coverAssetId] : undefined;
  const coverImage = project.images.find((i) => i.assetId === project.coverAssetId);
  return (
    <li className="project-card">
      <Link to={paths.project(lang, project.slug)} className="project-card__link">
        <span className="project-card__media">
          <Picture
            asset={cover}
            alt=""
            sizes={CARD_SIZES}
            priority={priority}
            eager={eager}
            focalPoint={coverImage?.focalPoint}
          />
        </span>
        <span className="project-card__title">{title}</span>
      </Link>
    </li>
  );
}
