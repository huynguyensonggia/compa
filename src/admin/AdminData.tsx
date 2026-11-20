import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from 'react';
import { loadRecords, resolveAssets, type Records } from './data/repository';
import type { AssetMap, AssetRecord } from '../content/types';

interface AdminDataValue {
  records: Records | null;
  assets: AssetMap;
  error: string | null;
  reload: () => Promise<void>;
  registerAssets: (recs: AssetRecord[]) => void;
}

const Ctx = createContext<AdminDataValue | null>(null);

export function AdminDataProvider({ children }: { children: ReactNode }) {
  const [records, setRecords] = useState<Records | null>(null);
  const [assets, setAssets] = useState<AssetMap>({});
  const [error, setError] = useState<string | null>(null);

  const reload = useCallback(async () => {
    try {
      const r = await loadRecords();
      setRecords(r);
      setAssets(resolveAssets(r.assets));
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    }
  }, []);

  /** Make freshly uploaded assets renderable without reloading (and resetting) open forms. */
  const registerAssets = useCallback((recs: AssetRecord[]) => {
    setAssets((prev) => ({ ...prev, ...resolveAssets(recs) }));
  }, []);

  useEffect(() => {
    reload();
  }, [reload]);

  return <Ctx.Provider value={{ records, assets, error, reload, registerAssets }}>{children}</Ctx.Provider>;
}

export function useAdminData() {
  const v = useContext(Ctx);
  if (!v) throw new Error('AdminDataProvider missing');
  return v;
}
