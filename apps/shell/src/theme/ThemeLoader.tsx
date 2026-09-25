import {useEffect, useRef} from 'react';

import type {ThemeConfig} from './themeTypes';

function applyTokens(tokens: Record<string, string>, prev: Record<string, string>) {
  const root = document.documentElement;
  for (const key of Object.keys(prev)) {
    if (!(key in tokens)) root.style.removeProperty(key);
  }
  for (const [key, value] of Object.entries(tokens)) {
    if (value) root.style.setProperty(key, value);
    else root.style.removeProperty(key);
  }
}

export function ThemeLoader({themeConfig}: {themeConfig: ThemeConfig}) {
  const prevTokensRef = useRef<Record<string, string>>({});

  useEffect(() => {
    applyTokens(themeConfig.tokens, prevTokensRef.current);
    prevTokensRef.current = themeConfig.tokens;
  }, [themeConfig]);

  return null;
}
