import { ProgressBar } from '../ui/ProgressBar';
import { formatCurrency } from '../../utils/formatters';
import styles from './RecoveredByProgramList.module.css';

export function RecoveredByProgramList({ programs }) {
  const maxValue = Math.max(...programs.map((p) => p.totalRecovered), 1);
  const total = programs.reduce((sum, p) => sum + p.totalRecovered, 0);

  return (
    <div className={styles.list}>
      <div className="mono-label">Recovered by program</div>

      <div className={styles.rows}>
        {programs.map((p) => (
          <div key={p.programId} className={styles.row}>
            <div className={styles.rowHeader}>
              <span className={styles.name}>{p.fullName || p.name}</span>
              <span className={`tabular-nums ${styles.value}`}>{formatCurrency(p.totalRecovered)}</span>
            </div>
            <ProgressBar value={p.totalRecovered} max={maxValue} />
          </div>
        ))}
      </div>

      <div className={styles.total}>
        <span className="mono-label">Total</span>
        <span className={`tabular-nums ${styles.totalValue}`}>{formatCurrency(total)}</span>
      </div>
    </div>
  );
}
