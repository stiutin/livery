/** The languages every tenant page is built in. The first segment after the tenant in every URL. */
export const LANGUAGES = {
  en: {name: 'English', locale: 'en-GB'},
  de: {name: 'Deutsch', locale: 'de-DE'},
  es: {name: 'Español', locale: 'es-ES'},
} as const;

export type Language = keyof typeof LANGUAGES;
export const LANGUAGE_CODES = Object.keys(LANGUAGES) as Language[];

export function isLanguage(value: unknown): value is Language {
  return typeof value === 'string' && Object.hasOwn(LANGUAGES, value);
}

/** A tenant's default language: the language of its tenant.json locale. */
export function defaultLanguage(tenantLocale: string): Language {
  const language = new Intl.Locale(tenantLocale).language;
  if (!isLanguage(language)) {
    throw new Error(
      `the locale ${tenantLocale} is in a language Livery is not translated into (${LANGUAGE_CODES.join(', ')})`
    );
  }
  return language;
}

/**
 * The locale for numbers and dates: the tenant's own when the page is in the tenant's language, so Harbour in
 * English keeps en-GB, and the language's usual one otherwise, so Harbour in German writes 49,99 £.
 */
export function formattingLocale(language: Language, tenantLocale: string): string {
  return new Intl.Locale(tenantLocale).language === language ? tenantLocale : LANGUAGES[language].locale;
}
