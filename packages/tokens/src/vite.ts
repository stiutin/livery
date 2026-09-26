import {resolve} from 'node:path';

import type {Plugin} from 'vite';

import type {CompiledTenants, TenantsOptions} from './node.ts';
import {compileTenantsFromDisk} from './node.ts';

const INDEX_ID = 'virtual:livery/tenants';
const TENANT_PREFIX = 'virtual:livery/tenant/';
const isOurs = (id: string): boolean => id === INDEX_ID || id.startsWith(TENANT_PREFIX);

/**
 * Compiles the tenants into two kinds of module:
 *
 * - `virtual:livery/tenants`: the list of tenants, the default one, and `loadTenant(id)`;
 * - `virtual:livery/tenant/<id>`: one tenant's settings, the CSS of its token set and its tokens,
 *   which `loadTenant` imports dynamically, so every tenant is a chunk of its own.
 *
 * Any problem, such as a missing token, text below WCAG AA contrast or an invalid tenant.json, stops the
 * build; the dev server shows it in the error overlay and recovers on the next save.
 */
export function liveryTokens(options: TenantsOptions): Plugin {
  let compiled: CompiledTenants | undefined;
  const watched = new Set<string>();

  const compile = (): CompiledTenants => {
    compiled ??= compileTenantsFromDisk(options);
    for (const file of compiled.files) {
      watched.add(resolve(file));
    }
    return compiled;
  };
  const failure = (result: CompiledTenants): string =>
    `Tenants have ${result.report.split('\n').length} problem(s):\n${result.report}`;

  const indexModule = ({tenants, defaultTenant}: CompiledTenants): string => {
    const cases = tenants
      .map(
        ({id}) =>
          `    case ${JSON.stringify(id)}: return import(${JSON.stringify(TENANT_PREFIX + id)}).then((m) => m.default);`
      )
      .join('\n');
    return [
      `export const defaultTenant = ${JSON.stringify(defaultTenant)};`,
      `export const tenants = ${JSON.stringify(tenants.map(({id, name}) => ({id, name})))};`,
      'export function loadTenant(id) {',
      '  switch (id) {',
      cases,
      '    default: return Promise.resolve(undefined);',
      '  }',
      '}',
    ].join('\n');
  };

  return {
    name: 'livery:tokens',

    buildStart() {
      compiled = undefined;
      const result = compile();
      for (const file of result.files) {
        this.addWatchFile(file);
      }
      if (result.report) {
        this.error(failure(result));
      }
    },

    resolveId(id) {
      return isOurs(id) ? `\0${id}` : undefined;
    },

    load(id) {
      if (!id.startsWith('\0') || !isOurs(id.slice(1))) {
        return null;
      }
      const result = compile();
      if (result.report) {
        this.error(failure(result));
      }
      const name = id.slice(1);
      if (name === INDEX_ID) {
        return indexModule(result);
      }
      const tenant = result.tenants.find((candidate) => TENANT_PREFIX + candidate.id === name);
      return tenant ? `export default ${JSON.stringify(tenant)};` : this.error(`there is no tenant "${name}"`);
    },

    configureServer(server) {
      server.watcher.add([...compile().files]);
      server.watcher.on('change', (file) => {
        if (!watched.has(resolve(file))) {
          return;
        }
        compiled = undefined;
        for (const environment of Object.values(server.environments)) {
          const graph = environment.moduleGraph;
          for (const id of graph.idToModuleMap.keys()) {
            const module = graph.getModuleById(id);
            if (module && id.startsWith('\0') && isOurs(id.slice(1))) {
              graph.invalidateModule(module);
            }
          }
        }
        server.ws.send({type: 'full-reload'});
      });
    },
  };
}
