import { useState } from 'react';
import { Button } from '../ui/Button';
import styles from './ItemDispositionBar.module.css';

const REJECT_REASONS = [
  'Insufficient documentation',
  'Provider attestation unclear',
  'Duplicate of an existing submission',
  'Does not meet program criteria',
];

export function ItemDispositionBar({ onApprove, onNeedsInfo, onReject, submitting }) {
  const [reason, setReason] = useState('');

  return (
    <div className={styles.bar}>
      <Button variant="primary" onClick={onApprove} disabled={submitting}>Approve &amp; submit</Button>
      <Button variant="outline" onClick={onNeedsInfo} disabled={submitting}>Needs more info</Button>
      <Button variant="outline" onClick={() => reason && onReject(reason)} disabled={submitting || !reason}>Reject</Button>
      <select className={styles.reasonSelect} value={reason} onChange={(e) => setReason(e.target.value)}>
        <option value="">Reason (required to reject)</option>
        {REJECT_REASONS.map((r) => (
          <option key={r} value={r}>{r}</option>
        ))}
      </select>
      <span className={`mono-label ${styles.note}`}>Every disposition is signed and logged</span>
    </div>
  );
}
