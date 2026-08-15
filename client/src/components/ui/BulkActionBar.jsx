import { Button } from './Button';
import { formatCurrency } from '../../utils/formatters';
import styles from './BulkActionBar.module.css';

export function BulkActionBar({ selectedCount, selectedValue, currentUser, onApprove, onAssign, onReject, onClear }) {
  if (!selectedCount) return null;

  return (
    <div className={styles.bar}>
      <div className={styles.summary}>
        <span className="mono-label">{selectedCount} selected</span>
        <span className={styles.divider} />
        <span className="mono-label tabular-nums">{formatCurrency(selectedValue)} est. value</span>
      </div>

      <div className={styles.actions}>
        <Button variant="primary" onClick={onApprove}>Approve &amp; submit</Button>
        <Button variant="outlineDark" onClick={onAssign}>Assign...</Button>
        <Button variant="outlineDark" onClick={onReject}>Reject...</Button>
      </div>

      <div className={styles.meta}>
        <span className="mono-label">Submits as {currentUser} · Logged to audit</span>
        <button type="button" className={styles.clear} onClick={onClear}>Clear</button>
      </div>
    </div>
  );
}
