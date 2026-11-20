import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import type { ContentState } from './types';

const ContentCtx = createContext<ContentState | null>(null);

export const CONTENT_CHANNEL = 'compa-content';
export const CONTENT_EVENT = 'compa:content-changed';

export function ContentProvider({ initial, children }: { initial: ContentState; children: ReactNode }) {
  const [state, setState] = useState(initial);

  useEffect(() => {
    // Local (dev) mode only: reflect edits made in /admin, which live in IndexedDB.
    if (!import.meta.env.DEV) return;
    let active = true;
    const reload = async () => {
      const { loadLocalContent } = await import('../admin/data/repository');
      const local = await loadLocalContent();
      if (active && local) setState(local);
    };
    window.addEventListener(CONTENT_EVENT, reload);
    const bc = 'BroadcastChannel' in window ? new BroadcastChannel(CONTENT_CHANNEL) : null;
    if (bc) bc.onmessage = reload;
    return () => {
      active = false;
      window.removeEventListener(CONTENT_EVENT, reload);
      bc?.close();
    };
  }, []);

  return <ContentCtx.Provider value={state}>{children}</ContentCtx.Provider>;
}

export function useContent(): ContentState {
  const ctx = useContext(ContentCtx);
  if (!ctx) throw new Error('ContentProvider missing');
  return ctx;
}
