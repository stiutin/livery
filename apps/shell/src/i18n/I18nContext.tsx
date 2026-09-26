import {IntlMessageFormat} from 'intl-messageformat';
import {Children, type ReactNode, useMemo} from 'react';

import type {Language} from './languages';
import type {MessageKey, Messages} from './messages';
import {I18nContext, type I18nValue} from './useI18n';

type Values = Record<string, string | number | boolean | Date>;
type RichValues = Record<string, string | number | boolean | Date | ((chunks: ReactNode[]) => ReactNode)>;

/**
 * Provides the page's language and messages. Messages are ICU MessageFormat, compiled once per key: plurals and
 * selects follow the language's rules through Intl.PluralRules, so German and Spanish get their own forms.
 */
export function I18nProvider({
  language,
  locale,
  messages,
  children,
}: {
  language: Language;
  locale: string;
  messages: Messages;
  children: ReactNode;
}) {
  const value = useMemo<I18nValue>(() => {
    const compiled = new Map<MessageKey, IntlMessageFormat>();
    const format = (key: MessageKey): IntlMessageFormat => {
      let message = compiled.get(key);
      if (!message) {
        message = new IntlMessageFormat(messages[key], locale);
        compiled.set(key, message);
      }
      return message;
    };
    return {
      language,
      locale,
      t: (key: MessageKey, values?: Values) => String(format(key).format(values)),
      rich: (key: MessageKey, values?: RichValues) => {
        const result = format(key).format<ReactNode>(values);
        return Array.isArray(result) ? <>{Children.toArray(result)}</> : result;
      },
    };
  }, [language, locale, messages]);

  return <I18nContext value={value}>{children}</I18nContext>;
}
