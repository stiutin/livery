import React from "react";
import { TenantContext } from "./context";

export function useTenant() {
  const ctx = React.useContext(TenantContext);
  if (!ctx) throw new Error("useTenant must be used within TenantProvider");
  return ctx;
}
