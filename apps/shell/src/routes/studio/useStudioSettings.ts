import {decodeSettings, encodeSettings, type StudioSettings} from '@livery/tokens';
import {useCallback, useMemo, useSyncExternalStore} from 'react';

const CHANGE = 'livery:studio-change';

function subscribe(onChange: () => void): () => void {
  window.addEventListener('hashchange', onChange);
  window.addEventListener(CHANGE, onChange);
  return () => {
    window.removeEventListener('hashchange', onChange);
    window.removeEventListener(CHANGE, onChange);
  };
}

/**
 * Studio's settings live in the URL hash, so the address bar is always a share link and a reload keeps the work.
 * The prerendered page has no hash, so the server snapshot is the empty string, which decodes to the defaults.
 */
export function useStudioSettings(): [StudioSettings, (change: Partial<StudioSettings>) => void] {
  const hash = useSyncExternalStore(
    subscribe,
    () => window.location.hash.slice(1),
    () => ''
  );
  const settings = useMemo(() => decodeSettings(hash), [hash]);

  const update = useCallback(
    (change: Partial<StudioSettings>) => {
      window.history.replaceState(window.history.state, '', `#${encodeSettings({...settings, ...change})}`);
      window.dispatchEvent(new Event(CHANGE));
    },
    [settings]
  );

  return [settings, update];
}
