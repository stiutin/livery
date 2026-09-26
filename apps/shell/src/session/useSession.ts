import {createContext, useContext} from 'react';

import type {Session} from '../api/types';

export interface SessionValue {
  /** `undefined` until the stored session has been read, `null` when signed out. */
  session: Session | null | undefined;
  signIn: (session: Session) => void;
  signOut: () => void;
}

export const SessionContext = createContext<SessionValue | null>(null);

export function useSession(): SessionValue {
  const value = useContext(SessionContext);
  if (!value) {
    throw new Error('useSession() needs a <SessionProvider> above it');
  }
  return value;
}
