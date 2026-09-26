// Types for the modules that the Vite plugin in ./vite.ts generates.
// Apps reference them with `/// <reference types="@livery/tokens/virtual" />`.

declare module 'virtual:livery/tenants' {
  import type {TenantManifest} from '@livery/tokens';

  const manifest: TenantManifest;
  export default manifest;
}

declare module 'virtual:livery/tenants.css';
