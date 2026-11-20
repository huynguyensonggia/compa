import { openDB, type DBSchema, type IDBPDatabase } from 'idb';
import type { AssetRecord, GalleryImage, Project, Redirect, SiteContent, SpaceGroup } from '../../content/types';

export interface Meta {
  seededAt: string;
  schema: number;
}

interface CompaDB extends DBSchema {
  kv: { key: string; value: SiteContent | Meta };
  projects: { key: string; value: Project };
  groups: { key: string; value: SpaceGroup & { projectId: string }; indexes: { projectId: string } };
  images: { key: string; value: GalleryImage & { projectId: string }; indexes: { projectId: string } };
  assets: { key: string; value: AssetRecord };
  redirects: { key: string; value: Redirect };
}

export const DB_NAME = 'compa-admin';
export const STORES = ['kv', 'projects', 'groups', 'images', 'assets', 'redirects'] as const;

let dbPromise: Promise<IDBPDatabase<CompaDB>> | null = null;

export function getDb() {
  if (!dbPromise) {
    dbPromise = openDB<CompaDB>(DB_NAME, 1, {
      upgrade(db) {
        db.createObjectStore('kv');
        db.createObjectStore('projects', { keyPath: 'id' });
        db.createObjectStore('groups', { keyPath: 'id' }).createIndex('projectId', 'projectId');
        db.createObjectStore('images', { keyPath: 'id' }).createIndex('projectId', 'projectId');
        db.createObjectStore('assets', { keyPath: 'id' });
        db.createObjectStore('redirects', { keyPath: 'from' });
      },
    });
  }
  return dbPromise;
}
