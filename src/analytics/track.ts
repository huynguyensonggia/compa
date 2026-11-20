// Pushes events to window.dataLayer. No personal data is ever sent.
// Nothing is loaded unless gtmId / ga4Id is configured; the pushes are harmless without it.
export type TrackEvent =
  | 'call_click'
  | 'email_click'
  | 'facebook_click'
  | 'instagram_click'
  | 'tiktok_click'
  | 'directions_click'
  | 'project_view'
  | 'language_switch';

export type TrackLocation = 'header' | 'footer' | 'contact' | 'project' | 'home';

declare global {
  interface Window {
    dataLayer?: Array<Record<string, unknown>>;
  }
}

export function track(event: TrackEvent, params: Record<string, string | number> = {}) {
  if (typeof window === 'undefined') return;
  window.dataLayer = window.dataLayer || [];
  window.dataLayer.push({ event, ...params });
}
