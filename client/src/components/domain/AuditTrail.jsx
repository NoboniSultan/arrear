import { Link } from 'react-router-dom';
import { Card } from '../ui/Card';
import { formatDateLong } from '../../utils/formatters';
import styles from './AuditTrail.module.css';

export function AuditTrail({ trail }) {
  return (
    <Card>
      <div className={styles.header}>
        <span className="mono-label">Audit trail</span>
        <Link to="/audit-log" className={styles.fullLog}>Full log →</Link>
      </div>

      <div className={styles.feed}>
        {trail.map((entry, i) => (
          <div key={i} className={styles.entry}>
            <span className={`${styles.marker} ${entry.pending ? styles.markerPending : ''}`} />
            <div>
              <div className={styles.description}>{entry.description}</div>
              <div className={`mono-label ${styles.meta}`}>
                {entry.pending
                  ? `Open ${entry.daysOpen} day${entry.daysOpen === 1 ? '' : 's'}`
                  : `${formatDateLong(entry.occurredAt)}${entry.actor ? ` · By ${entry.actor}` : ''}`}
              </div>
            </div>
          </div>
        ))}
      </div>
    </Card>
  );
}
