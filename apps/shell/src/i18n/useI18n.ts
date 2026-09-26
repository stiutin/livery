import {createContext, type ReactNode, useContext} from 'react';

import type {Language} from './languages';
import type {MessageKey} from './messages';

export interface I18nValue {
  language: Language;
  /** The locale for numbers and dates on this page. */
  locale: string;
  /** A message as plain text. */
  t: (key: MessageKey, values?: Record<string, string | number | boolean | Date>) => string;
  /** A message with tags, such as <b>…</b> or <link>…</link>, each rendered by a function. */
  rich: (
    key: MessageKey,
    values?: Record<string, string | number | boolean | Date | ((chunks: ReactNode[]) => ReactNode)>
  ) => ReactNode;
}

export const I18nContext = createContext<I18nValue | null>(null);

export function useI18n(): I18nValue {
  const value = useContext(I18nContext);
  if (!value) {
    throw new Error('useI18n() needs an <I18nProvider> above it');
  }
  return value;
}
