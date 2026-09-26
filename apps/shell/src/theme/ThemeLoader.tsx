import {useLayoutEffect} from 'react';

/**
 * Selects a tenant's compiled tokens by setting <html data-tenant>; the stylesheet from
 * `virtual:livery/tenants.css` holds every tenant's custom properties. A layout effect runs before the
 * browser paints, so rendered content never shows another tenant's colours.
 */
export function ThemeLoader({tokenSet}: {tokenSet: string}) {
  useLayoutEffect(() => {
    document.documentElement.dataset.tenant = tokenSet;
  }, [tokenSet]);

  return null;
}
