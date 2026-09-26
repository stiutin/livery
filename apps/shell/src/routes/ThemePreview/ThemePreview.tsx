import tenants from 'virtual:livery/tenants';

import {useTenant} from '../../tenant/useTenant';
import {resolveThemeForBrand} from '../../theme/themeRegistry';
import {useThemeComponents} from '../../theme/useThemeComponents';
import styles from './ThemePreview.module.css';

export default function ThemePreview() {
  const {brandId} = useTenant();
  const {BrandButton, BrandCard} = useThemeComponents();
  const {tokenSet} = resolveThemeForBrand(brandId);
  const colours = tenants.tenants
    .find((tenant) => tenant.id === tokenSet)
    ?.tokens.filter((token) => token.type === 'color' && token.path.startsWith('semantic.'));

  return (
    <div className="page">
      <h1 className="h1">Theme preview</h1>

      <p className="description">The semantic colours of {tokenSet}, compiled from its design tokens.</p>

      <BrandCard className={styles.swatchCard}>
        <ul className={styles.swatchGrid} aria-label="Colour tokens">
          {colours?.map((token) => (
            <li key={token.cssVariable} className={styles.swatchItem}>
              <div className={styles.swatchColor} style={{background: `var(${token.cssVariable})`}} />
              <div className={styles.swatchLabel}>
                <strong className={styles.swatchName}>{token.path.replace('semantic.color.', '')}</strong>
                <div className={styles.swatchVar}>{token.resolvedCss}</div>
              </div>
            </li>
          ))}
        </ul>
      </BrandCard>

      <BrandCard className={styles.componentsCard}>
        <h3 className="h3">Example components</h3>
        <div className={styles.buttonRow}>
          <BrandButton>Primary action</BrandButton>
          <BrandButton disabled>Disabled</BrandButton>
        </div>
      </BrandCard>
    </div>
  );
}
