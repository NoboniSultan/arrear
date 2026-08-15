import styles from './Badge.module.css';

const LABELS = {
  new: 'New',
  reviewed: 'Reviewed',
  submitted: 'Submitted',
  rejected: 'Rejected',
};

export function Badge({ status, children }) {
  const label = children || LABELS[status] || status;
  return <span className={`${styles.badge} ${styles[status] || ''}`}>{label}</span>;
}
