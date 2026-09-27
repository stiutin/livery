import {useContext} from 'react';

import {TenantContext, type TenantContextValue} from './context';

export function useTenant(): TenantContextValue {
  const tenant = useContext(TenantContext);
  if (!tenant) {
    throw new Error('useTenant() needs a <TenantProvider> above it');
  }
  return tenant;
}
