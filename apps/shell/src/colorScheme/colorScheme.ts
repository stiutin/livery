import type {ColorScheme} from '@livery/tokens';
import {useCallback, useSyncExternalStore} from 'react';

const STORAGE_KEY = 'livery:color-scheme';
const CHANGE = 'livery:color-scheme-change';

/** What the visitor chose in the header; `null` until they choose, so the brand's default applies. */
export type SchemeChoice = ColorScheme | null;

function readChoice(): SchemeChoice {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored === 'system' || stored === 'light' || stored === 'dark' ? stored : null;
  } catch {
    return null;
  }
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
 * The visitor's colour scheme choice, kept in localStorage for every tenant. A prerendered page cannot know it,
 * so the server snapshot is `null` and the brand's default renders; the inline script in the document has
 * already applied the stored choice before the first paint, and React catches up after hydration.
 */
export function useSchemeChoice(): [SchemeChoice, (choice: ColorScheme) => void] {
  const choice = useSyncExternalStore(subscribe, readChoice, () => null);
  const choose = useCallback((next: ColorScheme) => {
    try {
      localStorage.setItem(STORAGE_KEY, next);
    } catch {
      // Without storage the choice still applies to this page view.
    }
    window.dispatchEvent(new Event(CHANGE));
  }, []);
  return [choice, choose];
}

/**
 * The value of `<html data-color-scheme>`: an explicit `light` or `dark`, or `undefined` to follow the device.
 * The visitor's choice wins; without one, the brand's default does.
 */
export function schemeAttribute(choice: SchemeChoice, brandDefault: ColorScheme): 'light' | 'dark' | undefined {
  const scheme = choice ?? brandDefault;
  return scheme === 'system' ? undefined : scheme;
}

/**
 * The same decision as schemeAttribute, as a script for the document's head: it runs before the first paint, so
 * a page never flashes in the other scheme. Keep the two in step.
 */
export function schemeScript(brandDefault: ColorScheme): string {
  return (
    `(function(){var d=${JSON.stringify(brandDefault)},c=null;` +
    `try{c=localStorage.getItem(${JSON.stringify(STORAGE_KEY)})}catch(e){}` +
    `if(c!=='system'&&c!=='light'&&c!=='dark')c=d;` +
    `var e=document.documentElement;if(c==='system')e.removeAttribute('data-color-scheme');` +
    `else e.setAttribute('data-color-scheme',c)})()`
  );
}
