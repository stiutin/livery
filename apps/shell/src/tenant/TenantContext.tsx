import React from 'react';

import {DEFAULT_TENANT} from '../constants/common.const';
import {TenantContext, type TenantContextValue} from './context';

export type {TenantContextValue} from './context';

export function TenantProvider({value, children}: {value?: Partial<TenantContextValue>; children: React.ReactNode}) {
  const merged: TenantContextValue = {...DEFAULT_TENANT, ...value};

  return <TenantContext.Provider value={merged}>{children}</TenantContext.Provider>;
}
