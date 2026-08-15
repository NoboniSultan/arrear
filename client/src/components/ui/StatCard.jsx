import { Card } from './Card';
import styles from './StatCard.module.css';

export function StatCard({ label, value, children }) {
  return (
    <Card className={styles.statCard}>
      <div className={`mono-label ${styles.label}`}>{label}</div>
      <div className={`tabular-nums ${styles.value}`}>{value}</div>
      {children && <div className={styles.footer}>{children}</div>}
    </Card>
  );
}
