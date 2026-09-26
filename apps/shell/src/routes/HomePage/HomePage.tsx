import {Button, Card, Field, Select} from '@livery/ui';
import {useLocation, useNavigate} from 'react-router';

import {TENANT_OPTIONS} from '../../constants/common.const';
import {useTenant} from '../../tenant/useTenant';
import styles from './HomePage.module.css';

export default function HomePage() {
  const {brandId, locale, currency} = useTenant();
  const {search} = useLocation();
  const navigate = useNavigate();

  function setParam(key: string, value: string) {
    const params = new URLSearchParams(search);
    params.set(key, value);
    void navigate(`/?${params.toString()}`, {replace: true});
  }

  return (
    <div className="page">
      <h1 className="h1">Welcome</h1>

      <p className="description">Multi-tenant shell - switch tenant to see the theme change live.</p>

      <Card className={styles.card}>
        <h2 className="h2">Tenant settings</h2>
        <div className={styles.tenantGrid}>
          <Field label="Tenant">
            {(control) => (
              <Select
                {...control}
                value={brandId}
                onChange={(e) => {
                  setParam('brand', e.target.value);
                }}
              >
                {TENANT_OPTIONS.brands.map((brand) => (
                  <option key={brand} value={brand}>
                    {brand === 'tenant-default' ? 'fallback' : brand}
                  </option>
                ))}
              </Select>
            )}
          </Field>

          <Field label="Locale">
            {(control) => (
              <Select
                {...control}
                value={locale}
                onChange={(e) => {
                  setParam('locale', e.target.value);
                }}
              >
                {TENANT_OPTIONS.locales.map((localeOption) => (
                  <option key={localeOption} value={localeOption}>
                    {localeOption}
                  </option>
                ))}
              </Select>
            )}
          </Field>

          <Field label="Currency">
            {(control) => (
              <Select
                {...control}
                value={currency}
                onChange={(e) => {
                  setParam('currency', e.target.value);
                }}
              >
                {TENANT_OPTIONS.currencies.map((currencyOption) => (
                  <option key={currencyOption} value={currencyOption}>
                    {currencyOption}
                  </option>
                ))}
              </Select>
            )}
          </Field>
        </div>
      </Card>

      <Card className={styles.card}>
        <h3 className="h3">Branded components (theme boundary demo)</h3>
        <div className={styles.buttonGroup}>
          <Button
            onClick={() => {
              void navigate(`/auth/login${search}`);
            }}
          >
            Go to Login
          </Button>
          <Button
            onClick={() => {
              void navigate(`/account/billing${search}`);
            }}
          >
            Go to Billing
          </Button>
          <Button
            onClick={() => {
              void navigate(`/theme/preview${search}`);
            }}
          >
            Theme Preview
          </Button>
        </div>
      </Card>
    </div>
  );
}
