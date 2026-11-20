// Pure operations on a project's space groups and gallery images.
// Every operation returns new arrays with sortOrder renumbered 0..n per group.
import type { GalleryImage, SpaceGroup } from '../../content/types';
import { byOrder } from '../../content/resolve';

export type GroupKey = string | null; // null = Chưa phân loại

export function imagesOf(images: GalleryImage[], groupId: GroupKey): GalleryImage[] {
  return images.filter((i) => i.groupId === groupId).sort(byOrder);
}

export function sortedGroups(groups: SpaceGroup[]): SpaceGroup[] {
  return [...groups].sort(byOrder);
}

/** Visual order: unclassified first, then groups in order, images in order. */
export function visualOrder(groups: SpaceGroup[], images: GalleryImage[]): GalleryImage[] {
  return [null, ...sortedGroups(groups).map((g) => g.id)].flatMap((gid) => imagesOf(images, gid));
}

function withLists(images: GalleryImage[], lists: Map<GroupKey, GalleryImage[]>): GalleryImage[] {
  const touched = new Set(lists.keys());
  const untouched = images.filter((i) => !touched.has(i.groupId));
  const rebuilt = [...lists.entries()].flatMap(([gid, list]) => list.map((img, idx) => ({ ...img, groupId: gid, sortOrder: idx })));
  return [...untouched, ...rebuilt];
}

/**
 * Move images (keeping their relative visual order) into a target group, before `beforeId`
 * or appended at the end. Records are moved, never duplicated; alt text etc. is preserved.
 */
export function moveImages(
  groups: SpaceGroup[],
  images: GalleryImage[],
  ids: string[],
  target: GroupKey,
  beforeId: string | null = null,
): GalleryImage[] {
  const idSet = new Set(ids);
  const moving = visualOrder(groups, images).filter((i) => idSet.has(i.id));
  if (!moving.length) return images;
  const lists = new Map<GroupKey, GalleryImage[]>();
  for (const img of moving) {
    if (!lists.has(img.groupId)) lists.set(img.groupId, imagesOf(images, img.groupId).filter((i) => !idSet.has(i.id)));
  }
  const targetList = lists.get(target) ?? imagesOf(images, target).filter((i) => !idSet.has(i.id));
  const at = beforeId ? targetList.findIndex((i) => i.id === beforeId) : -1;
  const insertAt = at >= 0 ? at : targetList.length;
  targetList.splice(insertAt, 0, ...moving);
  lists.set(target, targetList);
  return withLists(images, lists);
}

/** Move one image up/down inside its group. */
export function shiftImage(images: GalleryImage[], id: string, delta: -1 | 1): GalleryImage[] {
  const img = images.find((i) => i.id === id);
  if (!img) return images;
  const list = imagesOf(images, img.groupId);
  const from = list.findIndex((i) => i.id === id);
  const to = from + delta;
  if (to < 0 || to >= list.length) return images;
  [list[from], list[to]] = [list[to], list[from]];
  return withLists(images, new Map([[img.groupId, list]]));
}

export function appendImages(images: GalleryImage[], added: GalleryImage[], target: GroupKey): GalleryImage[] {
  // `added` keeps the order the files were picked in, regardless of when each finished processing.
  const list = [...imagesOf(images, target), ...added.map((a) => ({ ...a, groupId: target }))];
  return withLists(images, new Map([[target, list]]));
}

export function removeImages(images: GalleryImage[], ids: string[]): GalleryImage[] {
  const idSet = new Set(ids);
  const remaining = images.filter((i) => !idSet.has(i.id));
  const affected = new Set(images.filter((i) => idSet.has(i.id)).map((i) => i.groupId));
  return withLists(remaining, new Map([...affected].map((g) => [g, imagesOf(remaining, g)])));
}

function renumberGroups(list: SpaceGroup[]): SpaceGroup[] {
  return list.map((g, idx) => ({ ...g, sortOrder: idx }));
}

export function shiftGroup(groups: SpaceGroup[], id: string, delta: -1 | 1): SpaceGroup[] {
  const list = sortedGroups(groups);
  const from = list.findIndex((g) => g.id === id);
  const to = from + delta;
  if (from < 0 || to < 0 || to >= list.length) return groups;
  [list[from], list[to]] = [list[to], list[from]];
  return renumberGroups(list);
}

export function moveGroupBefore(groups: SpaceGroup[], id: string, beforeId: string | null): SpaceGroup[] {
  const list = sortedGroups(groups);
  const g = list.find((x) => x.id === id);
  if (!g || id === beforeId) return groups;
  const rest = list.filter((x) => x.id !== id);
  const at = beforeId ? rest.findIndex((x) => x.id === beforeId) : -1;
  rest.splice(at >= 0 ? at : rest.length, 0, g);
  return renumberGroups(rest);
}

export function addGroup(groups: SpaceGroup[], group: SpaceGroup): SpaceGroup[] {
  return renumberGroups([...sortedGroups(groups), group]);
}

export type DeleteGroupMode = { type: 'move'; target: GroupKey } | { type: 'remove-images' };

export function deleteGroup(
  groups: SpaceGroup[],
  images: GalleryImage[],
  id: string,
  mode: DeleteGroupMode,
): { groups: SpaceGroup[]; images: GalleryImage[] } {
  const ids = imagesOf(images, id).map((i) => i.id);
  const nextImages = mode.type === 'move' ? moveImages(groups, images, ids, mode.target) : removeImages(images, ids);
  return { groups: renumberGroups(sortedGroups(groups).filter((g) => g.id !== id)), images: nextImages };
}
