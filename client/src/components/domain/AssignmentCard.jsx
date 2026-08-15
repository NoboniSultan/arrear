import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { ASSIGNEE_ROLES } from '../../constants';
import { formatDateLong, daysUntil } from '../../utils/formatters';
import styles from './AssignmentCard.module.css';

export function AssignmentCard({ item }) {
  const days = daysUntil(item.submit_by_date);

  return (
    <Card>
      <div className={styles.header}>
        {item.assignee ? (
          <div className={styles.person}>
            <span className={styles.avatar} />
            <div>
              <div className={styles.name}>{item.assignee}</div>
              <div className={`mono-label ${styles.role}`}>{ASSIGNEE_ROLES[item.assignee] || 'Reviewer'}</div>
            </div>
          </div>
        ) : (
          <span className={styles.unassigned}>Unassigned</span>
        )}
        <Button variant="secondary">{item.assignee ? 'Reassign' : 'Assign'}</Button>
      </div>

      <div className={styles.rows}>
        <div className={styles.row}>
          <span>Submission deadline</span>
          <span>{formatDateLong(item.submit_by_date)}</span>
        </div>
        <div className={styles.row}>
          <span>Days remaining</span>
          <span className={days < 0 ? styles.overdue : ''}>{days < 0 ? `${Math.abs(days)} overdue` : days}</span>
        </div>
        <div className={styles.row}>
          <span>Second review</span>
          <span>{item.requires_second_review ? 'Required' : 'Not required'}</span>
        </div>
      </div>
    </Card>
  );
}
