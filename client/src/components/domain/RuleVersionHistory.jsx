import { Card } from '../ui/Card';
import { formatDateLong } from '../../utils/formatters';
import styles from './RuleVersionHistory.module.css';

export function RuleVersionHistory({ versions }) {
  return (
    <Card>
      <div className="mono-label">Version history</div>
      <div className={styles.feed}>
        {versions.map((v) => (
          <div key={v.id} className={styles.entry}>
            <div className={styles.meta}>
              <span className="mono-label">v{v.version}</span>
              <span className="mono-label">{formatDateLong(v.finalized_at)} · {v.finalized_by}</span>
            </div>
            <p className={styles.description}>{v.change_notes}</p>
          </div>
        ))}
        {versions.length === 0 && <p className={styles.empty}>No finalized versions yet.</p>}
      </div>
    </Card>
  );
}
