import {join, resolve} from 'node:path';

/** Where GitHub Pages serves the site: /<repository>/. CI passes the real name, so a renamed fork still works. */
export const PAGES_BASE = process.env.BASE_PATH ?? '/livery/';
/** The site's origin, for absolute links search engines need (hreflang, canonical). CI passes the owner's. */
export const SITE_ORIGIN = process.env.SITE_ORIGIN ?? 'https://stiutin.github.io';
export const REPOSITORY = resolve(import.meta.dirname, '../..');

/** Where the tenants live and which one styles pages outside any tenant. */
export const TENANT_OPTIONS = {
  root: REPOSITORY,
  tenantsDir: join(REPOSITORY, 'tenants'),
  defaultTenant: 'harbour',
};
