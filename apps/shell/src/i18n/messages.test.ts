import {IntlMessageFormat} from 'intl-messageformat';
import {describe, expect, it} from 'vitest';

import {API_ERROR_CODES} from '../api/types';
import {defaultLanguage, formattingLocale, LANGUAGE_CODES, LANGUAGES} from './languages';
import de from './messages/de.json';
import en from './messages/en.json';
import es from './messages/es.json';

const CATALOGUES = {en, de, es};

interface Element {
  type: number;
  value?: unknown;
  children?: Element[];
  options?: Record<string, {value: Element[]}>;
}

// intl-messageformat's element types: 0 is literal text and 7 is the # in a plural; the rest name an argument.
const LITERAL = 0;
const POUND = 7;

/** The arguments and tags a message uses, from its parsed ICU syntax. */
function argumentsOf(message: string): string[] {
  const names = new Set<string>();
  const visit = (elements: Element[]): void => {
    for (const element of elements) {
      if (element.type !== LITERAL && element.type !== POUND && typeof element.value === 'string') {
        names.add(element.value);
      }
      visit(element.children ?? []);
      for (const option of Object.values(element.options ?? {})) {
        visit(option.value);
      }
    }
  };
  visit(new IntlMessageFormat(message, 'en').getAst());
  return [...names].sort();
}

describe('message catalogues', () => {
  it('cover every language Livery is built in', () => {
    expect(Object.keys(CATALOGUES).sort()).toEqual([...LANGUAGE_CODES].sort());
  });

  it.each(['de', 'es'] as const)('%s has exactly the English keys', (language) => {
    expect(Object.keys(CATALOGUES[language]).sort()).toEqual(Object.keys(en).sort());
  });

  it.each(LANGUAGE_CODES)('%s messages are valid ICU and use the same arguments as English', (language) => {
    for (const [key, message] of Object.entries(CATALOGUES[language])) {
      expect(() => new IntlMessageFormat(message, LANGUAGES[language].locale), key).not.toThrow();
      expect(argumentsOf(message), `${language} ${key}`).toEqual(argumentsOf(en[key as keyof typeof en]));
    }
  });

  it('has a message for every API error code', () => {
    for (const code of API_ERROR_CODES) {
      expect(Object.keys(en)).toContain(`error.${code}`);
    }
  });

  it('follows each language’s plural rules', () => {
    const summary = (language: keyof typeof CATALOGUES, count: number, unpaid: number) =>
      new IntlMessageFormat(CATALOGUES[language]['invoices.summary'], LANGUAGES[language].locale).format({
        count,
        unpaid,
      });
    expect(summary('en', 1, 0)).toBe('1 invoice, all paid.');
    expect(summary('en', 4, 2)).toBe('4 invoices, 2 to pay.');
    expect(summary('de', 1, 1)).toBe('1 Rechnung, 1 offen.');
    expect(summary('es', 3, 2)).toBe('3 facturas, 2 pendientes.');
  });
});

describe('languages', () => {
  it('takes the default language from the tenant locale', () => {
    expect(defaultLanguage('en-GB')).toBe('en');
    expect(defaultLanguage('de-DE')).toBe('de');
    expect(() => defaultLanguage('fr-FR')).toThrow('fr-FR');
  });

  it('keeps the tenant locale in its own language and uses the language’s own otherwise', () => {
    expect(formattingLocale('en', 'en-US')).toBe('en-US');
    expect(formattingLocale('de', 'en-US')).toBe('de-DE');
    expect(formattingLocale('es', 'de-DE')).toBe('es-ES');
  });
});
