import { Card } from '../ui/Card';
import { formatCurrency } from '../../utils/formatters';
import styles from './ValueEstimateCard.module.css';

export function ValueEstimateCard({ item }) {
  return (
    <Card>
      <div className="mono-label">Value estimate</div>
      <div className={styles.rows}>
        {item.raf_delta !== null && item.raf_delta !== undefined && (
          <div className={styles.row}>
            <span>RAF delta</span>
            <span className="tabular-nums">{item.raf_delta > 0 ? '+' : ''}{Number(item.raf_delta).toFixed(3)}</span>
          </div>
        )}
        <div className={styles.row}>
          <span>Plan benchmark, annual</span>
          <span className="tabular-nums">{formatCurrency(item.plan_benchmark_annual)}</span>
        </div>
        <div className={styles.row}>
          <span>Months remaining in year</span>
          <span className="tabular-nums">{item.months_remaining_in_year} of 12</span>
        </div>
        <div className={styles.row}>
          <span>Contract share</span>
          <span className="tabular-nums">{Number(item.contract_share_pct).toFixed(1)}%</span>
        </div>
      </div>

      <div className={styles.estimateRow}>
        <span className="mono-label">Estimate</span>
        <span className={`tabular-nums ${styles.estimateValue}`}>{formatCurrency(item.estimated_dollar_value)}</span>
      </div>

      <p className={styles.disclaimer}>
        A modelled estimate from contract terms, not a guarantee of payment. Final value is set at reconciliation.
      </p>
    </Card>
  );
}
