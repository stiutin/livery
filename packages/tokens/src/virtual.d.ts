// Types for the modules that the Vite plugin in ./vite.ts generates.
// Apps reference them with `/// <reference types="@livery/tokens/virtual" />`.

declare module 'virtual:livery/tenants' {
  import type {LoadedTenant, TenantSummary} from '@livery/tokens';

  /** The tenant that styles pages outside any tenant. */
  export const defaultTenant: string;
  export const tenants: readonly TenantSummary[];
  /** One tenant's chunk, or undefined for an id that is not a tenant. */
  export function loadTenant(id: string): Promise<LoadedTenant | undefined>;
}
