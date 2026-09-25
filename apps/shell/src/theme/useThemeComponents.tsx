import React from "react";
import { useTenant } from "../tenant/useTenant";
import { resolveThemeForBrand } from "./themeRegistry";

export function useThemeComponents() {
  const { brandId } = useTenant();

  return React.useMemo(() => {
    const { themeModule } = resolveThemeForBrand(brandId);
    return {
      BrandButton: themeModule.BrandButton,
      BrandCard: themeModule.BrandCard,
    };
  }, [brandId]);
}
