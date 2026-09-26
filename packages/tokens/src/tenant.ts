import type {Problem} from './model.ts';

/** A tenant as `tenants/<id>/tenant.json` describes it, after validation. */
export interface TenantConfig {
  /** The folder name, which is also the first segment of every URL of the tenant. */
  readonly id: string;
  /** The brand's name, as people read it. */
  readonly name: string;
  /** The tenant whose tokens.json styles this one: its own by default, another one to share a look. */
  readonly tokens: string;
  /** BCP 47 locale for numbers and dates, such as `en-GB`. */
  readonly locale: string;
  /** ISO 4217 currency code, such as `GBP`. */
  readonly currency: string;
  /** What the tenant's customers can do; every flag is set explicitly. */
  readonly features: Readonly<Record<Feature, boolean>>;
}

/** Feature flags a tenant.json sets. Adding one means adding it here, to the schema and to every tenant. */
export const FEATURES = ['payments'] as const;
export type Feature = (typeof FEATURES)[number];

const KNOWN_KEYS = new Set(['$schema', 'name', 'tokens', 'locale', 'currency', 'features']);
export const TENANT_ID = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function isLocale(value: string): boolean {
  try {
    return Intl.getCanonicalLocales(value)[0] === value;
  } catch {
    return false;
  }
}

const CURRENCIES = new Set(Intl.supportedValuesOf('currency'));

function readFeatures(
  value: unknown,
  report: (path: string, message: string) => void
): Record<Feature, boolean> | undefined {
  if (!isRecord(value)) {
    report('features', `is required: an object with ${FEATURES.join(', ')}`);
    return undefined;
  }
  let valid = true;
  for (const key of Object.keys(value)) {
    if (!FEATURES.some((feature) => feature === key)) {
      report(`features.${key}`, `is not a feature; the flags are ${FEATURES.join(', ')}`);
      valid = false;
    }
  }
  const flags = {} as Record<Feature, boolean>;
  for (const feature of FEATURES) {
    const flag = value[feature];
    if (typeof flag === 'boolean') {
      flags[feature] = flag;
    } else {
      report(`features.${feature}`, 'must be true or false');
      valid = false;
    }
  }
  return valid ? flags : undefined;
}

/**
 * Validates one tenant.json. `tokenSets` are the folders that have a tokens.json, so a tenant can only
 * point at a look that exists. Every problem is reported; the config is returned only when there are none.
 */
export function parseTenantConfig(
  id: string,
  source: string,
  json: unknown,
  tokenSets: readonly string[]
): {config: TenantConfig | undefined; problems: Problem[]} {
  const problems: Problem[] = [];
  const report = (path: string, message: string): void => {
    problems.push({source, path, message});
  };

  if (!TENANT_ID.test(id)) {
    report('(folder)', `"${id}" cannot be a tenant id: use lower-case letters, digits and single hyphens`);
  }
  if (!isRecord(json)) {
    report('(root)', 'a tenant file must contain a JSON object');
    return {config: undefined, problems};
  }
  for (const key of Object.keys(json)) {
    if (!KNOWN_KEYS.has(key)) {
      report(key, 'is not a tenant setting; use name, tokens, locale, currency and features');
    }
  }

  const {name, tokens = id, locale, currency, features} = json;
  const flags = readFeatures(features, report);
  if (typeof name !== 'string' || name.trim() === '') {
    report('name', 'is required: the brand name people read');
  }
  if (typeof tokens !== 'string' || !tokenSets.includes(tokens)) {
    report('tokens', `must name a tenant folder with a tokens.json (${tokenSets.join(', ')})`);
  }
  if (typeof locale !== 'string' || !isLocale(locale)) {
    report('locale', 'must be a canonical BCP 47 locale, such as "en-GB"');
  }
  if (typeof currency !== 'string' || !CURRENCIES.has(currency)) {
    report('currency', 'must be an ISO 4217 code, such as "GBP"');
  }

  if (
    problems.length > 0 ||
    typeof name !== 'string' ||
    typeof tokens !== 'string' ||
    typeof locale !== 'string' ||
    typeof currency !== 'string' ||
    !flags
  ) {
    return {config: undefined, problems};
  }
  return {config: {id, name, tokens, locale, currency, features: flags}, problems};
}
