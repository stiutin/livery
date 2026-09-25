import { SWATCHES } from "../../constants/common.const";
import { useThemeComponents } from "../../theme/useThemeComponents";
import styles from "./ThemePreview.module.css";

export default function ThemePreview() {
  const { BrandButton, BrandCard } = useThemeComponents();

  return (
    <div className="page">
      <h1 className="h1">Theme preview</h1>

      <p className="description">
        Quick preview of the active tenant theme tokens
      </p>

      <BrandCard className={styles.swatchCard}>
        <div className={styles.swatchGrid}>
          {SWATCHES.map((s) => (
            <div key={s.var} className={styles.swatchItem}>
              <div
                className={styles.swatchColor}
                style={{ background: `var(${s.var})` }}
              />
              <div className={styles.swatchLabel}>
                <strong className={styles.swatchName}>{s.name}</strong>
                <div className={styles.swatchVar}>{s.var}</div>
              </div>
            </div>
          ))}
        </div>
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
