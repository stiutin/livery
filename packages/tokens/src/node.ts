import {existsSync, readdirSync, readFileSync} from 'node:fs';
import {join, relative, resolve} from 'node:path';

import {compileTenant, formatProblems, tokenSetToCss} from './compile.ts';
import type {CompiledTenant, LoadedTenant, Problem, TokenSource} from './model.ts';
import {parseTenantConfig} from './tenant.ts';

/** The shared base layer: component tokens mapped to semantic ones, and defaults tenants rarely change. */
export const BASE_TOKENS_FILE = resolve(import.meta.dirname, '..', 'base.tokens.json');

export interface TenantsOptions {
  /** The repository root, used to show short file names in messages. */
  readonly root: string;
  /** One folder per tenant: tenant.json for its settings, tokens.json for its look (or `tokens` to borrow one). */
  readonly tenantsDir: string;
  /** The tenant that styles pages outside any tenant: the landing page and the 404 page. */
  readonly defaultTenant: string;
  readonly baseFile?: string;
}

export interface CompiledTenants {
  /** Every folder with a tokens.json, compiled and checked. */
  readonly tokenSets: readonly CompiledTenant[];
  /** Every folder with a valid tenant.json, with the CSS and tokens of its token set. */
  readonly tenants: readonly LoadedTenant[];
  readonly defaultTenant: string;
  /** Every file read, for watchers. */
  readonly files: readonly string[];
  /** Empty when everything is valid; otherwise one line per problem. */
  readonly report: string;
}

function readJson(file: string, root: string): TokenSource {
  const name = relative(root, file);
  try {
    return {name, json: JSON.parse(readFileSync(file, 'utf8'))};
  } catch (error) {
    throw new Error(`${name} is not valid JSON: ${error instanceof Error ? error.message : String(error)}`, {
      cause: error,
    });
  }
}

const formatConfigProblems = (problems: readonly {tenant: string; problem: Problem}[]): string =>
  problems
    .map(({tenant, problem}) => `  ${tenant} › ${problem.source} › ${problem.path}: ${problem.message}`)
    .join('\n');

/**
 * Reads the base file and every tenant folder, compiles the token sets and validates the tenant settings.
 * Throws only on unreadable files; everything else is collected in `report`.
 */
export function compileTenantsFromDisk({
  root,
  tenantsDir,
  defaultTenant,
  baseFile = BASE_TOKENS_FILE,
}: TenantsOptions): CompiledTenants {
  const base = readJson(baseFile, root);
  const folders = readdirSync(tenantsDir, {withFileTypes: true})
    .filter((entry) => entry.isDirectory())
    .map((entry) => entry.name)
    .sort();
  const has = (folder: string, file: string): boolean => existsSync(join(tenantsDir, folder, file));

  const tokenSetIds = folders.filter((folder) => has(folder, 'tokens.json'));
  const tenantIds = folders.filter((folder) => has(folder, 'tenant.json'));
  if (!tenantIds.includes(defaultTenant)) {
    throw new Error(
      `the default tenant "${defaultTenant}" has no ${relative(root, tenantsDir)}/${defaultTenant}/tenant.json`
    );
  }

  const tokenSets = tokenSetIds.map((id) =>
    compileTenant(id, [base, readJson(join(tenantsDir, id, 'tokens.json'), root)])
  );
  const configProblems: {tenant: string; problem: Problem}[] = [];
  const tenants: LoadedTenant[] = [];

  for (const id of tenantIds) {
    const {name, json} = readJson(join(tenantsDir, id, 'tenant.json'), root);
    const {config, problems} = parseTenantConfig(id, name, json, tokenSetIds);
    configProblems.push(...problems.map((problem) => ({tenant: id, problem})));
    const tokenSet = tokenSets.find((set) => set.id === config?.tokens);
    if (config && tokenSet) {
      const {tokens, ...settings} = config;
      tenants.push({...settings, tokenSet: tokens, css: tokenSetToCss(tokenSet), tokens: tokenSet.tokens});
    }
  }

  return {
    tokenSets,
    tenants,
    defaultTenant,
    files: [
      baseFile,
      ...tokenSetIds.map((id) => join(tenantsDir, id, 'tokens.json')),
      ...tenantIds.map((id) => join(tenantsDir, id, 'tenant.json')),
    ],
    report: [formatProblems(tokenSets), formatConfigProblems(configProblems)].filter(Boolean).join('\n'),
  };
}
