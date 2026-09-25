import React from 'react';
import {TenantContext, type TenantContextValue} from './context';
import {DEFAULT_TENANT} from '../constants/common.const';

export type {TenantContextValue} from './context';

export function TenantProvider({value, children}: {value?: Partial<TenantContextValue>; children: React.ReactNode}) {
  const merged: TenantContextValue = {...DEFAULT_TENANT, ...value};

  return <TenantContext.Provider value={merged}>{children}</TenantContext.Provider>;
}
