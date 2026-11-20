import { createContext, useContext, useEffect } from 'react';
import { useContent } from '../content/ContentContext';
import { applyHead, type HeadData } from './head';

/** During prerendering the page's head data is collected here instead of touching the DOM. */
export interface HeadCollector {
  data: HeadData | null;
}
export const HeadCollectorCtx = createContext<HeadCollector | null>(null);

export function Seo(props: HeadData) {
  const collector = useContext(HeadCollectorCtx);
  const { site } = useContent();
  if (collector) collector.data = props;
  const key = JSON.stringify(props);
  useEffect(() => {
    applyHead(props, site);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key, site]);
  return null;
}
