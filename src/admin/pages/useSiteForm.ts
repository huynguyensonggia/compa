import { useEffect, useMemo, useState } from 'react';
import { useAdminData } from '../AdminData';
import { saveSite } from '../data/repository';
import { timeNow, useUnsavedGuard } from '../components/ui';
import type { SiteContent } from '../../content/types';

/** Draft/save state for the site document, with unsaved-changes guard. */
export function useSiteForm() {
  const { records, reload } = useAdminData();
  const [saved, setSaved] = useState<SiteContent | null>(null);
  const [draft, setDraft] = useState<SiteContent | null>(null);
  const [savedAt, setSavedAt] = useState<string | null>(null);

  useEffect(() => {
    if (records && !draft) {
      setSaved(structuredClone(records.site));
      setDraft(structuredClone(records.site));
    }
  }, [records, draft]);

  const dirty = useMemo(() => !!draft && JSON.stringify(draft) !== JSON.stringify(saved), [draft, saved]);
  useUnsavedGuard(dirty);

  const save = async () => {
    if (!draft) return;
    await saveSite(draft);
    setSaved(structuredClone(draft));
    setSavedAt(timeNow());
    await reload();
  };

  return { draft, setDraft, dirty, savedAt, save, reset: () => saved && setDraft(structuredClone(saved)) };
}
