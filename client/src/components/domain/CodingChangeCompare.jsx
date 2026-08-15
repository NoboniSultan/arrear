import { Card } from '../ui/Card';
import styles from './CodingChangeCompare.module.css';

function rafCaption(raf, fallback) {
  if (raf === null || raf === undefined) return fallback;
  const sign = raf > 0 ? '+' : '';
  return `RAF ${sign}${Number(raf).toFixed(3)}`;
}

export function CodingChangeCompare({ item }) {
  return (
    <Card>
      <div className="mono-label">Proposed coding change</div>

      <div className={styles.compare}>
        <div className={styles.box}>
          <div className="mono-label">As submitted</div>
          <div className={`${styles.code} ${styles.strike}`}>{item.as_submitted_code}</div>
          <p className={styles.description}>{item.as_submitted_description}</p>
          <div className={`mono-label ${styles.caption}`}>{rafCaption(item.as_submitted_raf, 'No measure submitted')}</div>
        </div>

        <div className={styles.arrow} aria-hidden="true">→</div>

        <div className={`${styles.box} ${styles.proposed}`}>
          <div className="mono-label">Proposed</div>
          <div className={styles.code}>{item.proposed_code}</div>
          <p className={styles.description}>{item.proposed_description}</p>
          <div className={`mono-label ${styles.captionAccent}`}>{rafCaption(item.proposed_raf, 'Numerator met')}</div>
        </div>
      </div>
    </Card>
  );
}
