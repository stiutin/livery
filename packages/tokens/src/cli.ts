/**
 * Prints every tenant's contrast report and problems.
 *
 *   npm run tokens            # a summary per tenant, then every problem; exits with 1 if there are any
 *   npm run tokens -- --all   # every contrast pair of every tenant, passing or not
 */
import {resolve} from 'node:path';

import {compileTenantsFromDisk} from './node.ts';

const root = resolve(import.meta.dirname, '..', '..', '..');
const all = process.argv.includes('--all');
const result = compileTenantsFromDisk({root, tenantsDir: resolve(root, 'tenants'), defaultTenant: 'tenant-default'});

for (const tenant of result.tenants) {
  const failing = tenant.contrast.filter((pair) => !pair.passes).length;
  const mark = tenant.problems.length === 0 ? '✔' : '✖';
  console.log(
    `${mark} ${tenant.id}: ${tenant.tokens.length} tokens, ${tenant.contrast.length - failing}/${tenant.contrast.length} contrast pairs pass`
  );
  if (all) {
    for (const pair of tenant.contrast) {
      console.log(
        `    ${pair.passes ? '✔' : '✖'} ${pair.ratio.toFixed(2).padStart(5)}:1 (needs ${pair.minimum}) ${pair.label}`
      );
    }
  }
}

if (result.report) {
  console.error(`\n${result.report}`);
  process.exit(1);
}
