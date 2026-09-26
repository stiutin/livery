import {type ReactNode, useCallback, useMemo, useSyncExternalStore} from 'react';

import type {Session} from '../api/types';
import {SessionContext, type SessionValue} from './useSession';

const storageKey = (tenant: string): string => `livery:session:${tenant}`;
const CHANGE = 'livery:session-change';

let cache: {raw: string | null; session: Session | null} = {raw: null, session: null};

function parseSession(raw: string | null): Session | null {
  try {
    const parsed: unknown = JSON.parse(raw ?? 'null');
    return typeof parsed === 'object' && parsed !== null && 'token' in parsed ? (parsed as Session) : null;
  } catch {
    return null;
  }
}

function storedRaw(tenant: string): string | null {
  try {
    return sessionStorage.getItem(storageKey(tenant));
  } catch {
    return null;
  }
}

function readSession(tenant: string): Session | null {
  const raw = storedRaw(tenant);
  // useSyncExternalStore needs the same object back while nothing changed.
  if (raw !== cache.raw) {
    cache = {raw, session: parseSession(raw)};
  }
  return cache.session;
}

function subscribe(onChange: () => void): () => void {
  window.addEventListener(CHANGE, onChange);
  window.addEventListener('storage', onChange);
  return () => {
    window.removeEventListener(CHANGE, onChange);
    window.removeEventListener('storage', onChange);
  };
}

/**
 * The signed-in customer of one tenant, kept for the browser session. Prerendered HTML cannot know it, so the
 * server snapshot is `undefined` ("not known yet"), and React switches to the stored session after hydration.
 */
export function SessionProvider({tenant, children}: {tenant: string; children: ReactNode}) {
  const session = useSyncExternalStore(
    subscribe,
    () => readSession(tenant),
    () => undefined
  );

  const signIn = useCallback(
    (next: Session) => {
      sessionStorage.setItem(storageKey(tenant), JSON.stringify(next));
      window.dispatchEvent(new Event(CHANGE));
    },
    [tenant]
  );
  const signOut = useCallback(() => {
    sessionStorage.removeItem(storageKey(tenant));
    window.dispatchEvent(new Event(CHANGE));
  }, [tenant]);

  const value = useMemo<SessionValue>(() => ({session, signIn, signOut}), [session, signIn, signOut]);
  return <SessionContext value={value}>{children}</SessionContext>;
}
