import { useNavigate, useLocation } from "react-router-dom";
import { useTenant } from "../../tenant/useTenant";
import { useThemeComponents } from "../../theme/useThemeComponents";
import { TENANT_OPTIONS } from "../../constants/common.const";
import styles from "./HomePage.module.css";

export default function HomePage() {
  const { brandId, locale, currency } = useTenant();
  const { BrandButton, BrandCard } = useThemeComponents();
  const { search } = useLocation();
  const navigate = useNavigate();

  function setParam(key: string, value: string) {
    const params = new URLSearchParams(search);
    params.set(key, value);
    navigate(`/?${params.toString()}`, { replace: true });
  }

  return (
    <div className="page">
      <h1 className="h1">Welcome</h1>

      <p className="description">
        Multi-tenant shell - switch tenant to see the theme change live.
      </p>

      <BrandCard style={{ marginTop: 24 }}>
        <h2 className="h2">Tenant settings</h2>
        <div className={styles.tenantGrid}>
          <div className={styles.tenantField}>
            <label htmlFor="brand-select">Tenant</label>
            <select
              id="brand-select"
              value={brandId}
              onChange={(e) => setParam("brand", e.target.value)}
            >
              {TENANT_OPTIONS.brands.map((brand) => (
                <option key={brand} value={brand}>
                  {brand === "tenant-default" ? "fallback" : brand}
                </option>
              ))}
            </select>
          </div>

          <div className={styles.tenantField}>
            <label htmlFor="locale-select">Locale</label>
            <select
              id="locale-select"
              value={locale}
              onChange={(e) => setParam("locale", e.target.value)}
            >
              {TENANT_OPTIONS.locales.map((localeOption) => (
                <option key={localeOption} value={localeOption}>
                  {localeOption}
                </option>
              ))}
            </select>
          </div>

          <div className={styles.tenantField}>
            <label htmlFor="currency-select">Currency</label>
            <select
              id="currency-select"
              value={currency}
              onChange={(e) => setParam("currency", e.target.value)}
            >
              {TENANT_OPTIONS.currencies.map((currencyOption) => (
                <option key={currencyOption} value={currencyOption}>
                  {currencyOption}
                </option>
              ))}
            </select>
          </div>
        </div>
      </BrandCard>

      <BrandCard style={{ marginTop: 16 }}>
        <h3 className="h3">Branded components (theme boundary demo)</h3>
        <div className={styles.buttonGroup}>
          <BrandButton onClick={() => navigate(`/auth/login${search}`)}>
            Go to Login
          </BrandButton>
          <BrandButton onClick={() => navigate(`/account/billing${search}`)}>
            Go to Billing
          </BrandButton>
          <BrandButton onClick={() => navigate(`/theme/preview${search}`)}>
            Theme Preview
          </BrandButton>
        </div>
      </BrandCard>
    </div>
  );
}
