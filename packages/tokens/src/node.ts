import {existsSync, readdirSync, readFileSync} from 'node:fs';
import {join, relative, resolve} from 'node:path';

import {compileTenant, formatProblems, tenantsToCss, tenantsToManifest} from './compile.ts';
import type {CompiledTenant, TenantManifest, TokenSource} from './model.ts';

/** The shared base layer: component tokens mapped to semantic ones, and defaults tenants rarely change. */
export const BASE_TOKENS_FILE = resolve(import.meta.dirname, '..', 'base.tokens.json');

export interface TenantsOptions {
  /** The repository root, used to show short file names in messages. */
  readonly root: string;
  /** The directory with one folder per tenant, each holding a tokens.json. */
  readonly tenantsDir: string;
  /** The tenant that also styles `:root`. */
  readonly defaultTenant: string;
  readonly baseFile?: string;
}

export interface CompiledTenants {
  readonly tenants: readonly CompiledTenant[];
  readonly css: string;
  readonly manifest: TenantManifest;
  /** Every file read, for watchers. */
  readonly files: readonly string[];
  /** Empty when every tenant is valid; otherwise one line per problem. */
  readonly report: string;
}

function readSource(file: string, root: string): TokenSource {
  const name = relative(root, file);
  try {
    return {name, json: JSON.parse(readFileSync(file, 'utf8'))};
  } catch (error) {
    throw new Error(`${name} is not valid JSON: ${error instanceof Error ? error.message : String(error)}`, {
      cause: error,
    });
  }
}

/** Reads the base file and every tenant's tokens.json, and compiles them. Throws only on unreadable files. */
export function compileTenantsFromDisk({
  root,
  tenantsDir,
  defaultTenant,
  baseFile = BASE_TOKENS_FILE,
}: TenantsOptions): CompiledTenants {
  const base = readSource(baseFile, root);
  const ids = readdirSync(tenantsDir, {withFileTypes: true})
    .filter((entry) => entry.isDirectory() && existsSync(join(tenantsDir, entry.name, 'tokens.json')))
    .map((entry) => entry.name)
    .sort();

  if (!ids.includes(defaultTenant)) {
    throw new Error(
      `the default tenant "${defaultTenant}" has no ${relative(root, tenantsDir)}/${defaultTenant}/tokens.json`
    );
  }

  const files = [baseFile, ...ids.map((id) => join(tenantsDir, id, 'tokens.json'))];
  const tenants = ids.map((id) => compileTenant(id, [base, readSource(join(tenantsDir, id, 'tokens.json'), root)]));

  return {
    tenants,
    css: tenantsToCss(tenants, defaultTenant),
    manifest: tenantsToManifest(tenants, defaultTenant),
    files,
    report: formatProblems(tenants),
  };
}
