import { useEffect, useMemo, useState } from 'react';
import { useAdminData } from '../AdminData';
import { saveSite, ValidationError } from '../data/repository';
import { timeNow, useUnsavedGuard } from '../components/ui';
import type { SiteContent } from '../../content/types';

/** Draft/save state for the site document, with unsaved-changes guard. */
export function useSiteForm() {
  const { records, reload } = useAdminData();
  const [saved, setSaved] = useState<SiteContent | null>(null);
  const [draft, setDraft] = useState<SiteContent | null>(null);
  const [savedAt, setSavedAt] = useState<string | null>(null);
  const [errors, setErrors] = useState<string[]>([]);

  useEffect(() => {
    if (records && !draft) {
      setSaved(structuredClone(records.site));
      setDraft(structuredClone(records.site));
    }
  }, [records, draft]);

  const dirty = useMemo(() => !!draft && JSON.stringify(draft) !== JSON.stringify(saved), [draft, saved]);
  useUnsavedGuard(dirty);

  const save = async () => {
    if (!draft) return false;
    try {
      await saveSite(draft);
    } catch (e) {
      setErrors(e instanceof ValidationError ? e.issues : [(e as Error).message]);
      return false;
    }
    setErrors([]);
    setSaved(structuredClone(draft));
    setSavedAt(timeNow());
    await reload();
    return true;
  };

  return { draft, setDraft, dirty, savedAt, save, errors, reset: () => saved && setDraft(structuredClone(saved)) };
}
