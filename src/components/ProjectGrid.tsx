import type { AssetMap, ProjectFull } from '../content/types';
import { ProjectCard } from './ProjectCard';

interface Props {
  projects: ProjectFull[];
  assets: AssetMap;
  /** Number of leading cards loaded eagerly (above the fold). */
  eager?: number;
}

export function ProjectGrid({ projects, assets, eager = 3 }: Props) {
  return (
    <ul className="project-grid">
      {projects.map((p, i) => (
        <ProjectCard key={p.id} project={p} assets={assets} priority={eager > 0 && i === 0} eager={i < eager} />
      ))}
    </ul>
  );
}
