import {resolve} from 'node:path';

import type {Plugin} from 'vite';

import type {CompiledTenants, TenantsOptions} from './node.ts';
import {compileTenantsFromDisk} from './node.ts';

const CSS_ID = 'virtual:livery/tenants.css';
const MANIFEST_ID = 'virtual:livery/tenants';
// The CSS id keeps its extension, so Vite's CSS pipeline picks it up; `\0` keeps other plugins away.
const RESOLVED = new Map([
  [CSS_ID, `\0${CSS_ID}`],
  [MANIFEST_ID, `\0${MANIFEST_ID}`],
]);

/**
 * Compiles the tenants' token files into `virtual:livery/tenants.css` (every tenant's custom properties) and
 * `virtual:livery/tenants` (the same tokens as data). Any problem, such as a missing token or text below
 * WCAG AA contrast, stops the build; the dev server shows it in the error overlay and recovers on the next save.
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
    `Design tokens have ${result.tenants.reduce((sum, tenant) => sum + tenant.problems.length, 0)} problem(s):\n${result.report}`;

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
      return RESOLVED.get(id);
    },

    load(id) {
      if (id !== RESOLVED.get(CSS_ID) && id !== RESOLVED.get(MANIFEST_ID)) {
        return null;
      }
      const result = compile();
      if (result.report) {
        this.error(failure(result));
      }
      return id === RESOLVED.get(CSS_ID) ? result.css : `export default ${JSON.stringify(result.manifest)};`;
    },

    configureServer(server) {
      server.watcher.add([...compile().files]);
      server.watcher.on('change', (file) => {
        if (!watched.has(resolve(file))) {
          return;
        }
        compiled = undefined;
        for (const id of RESOLVED.values()) {
          const module = server.moduleGraph.getModuleById(id);
          if (module) {
            server.moduleGraph.invalidateModule(module);
          }
        }
        server.ws.send({type: 'full-reload'});
      });
    },
  };
}
