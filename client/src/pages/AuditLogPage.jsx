import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { TopBar } from '../components/layout/TopBar';
import { Card } from '../components/ui/Card';
import { fetchAuditLog } from '../services/api';
import { formatDateLong } from '../utils/formatters';
import styles from './AuditLogPage.module.css';

export function AuditLogPage() {
  const [entries, setEntries] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAuditLog().then(setEntries).finally(() => setLoading(false));
  }, []);

  return (
    <>
      <TopBar breadcrumb={['Audit log']} />
      <div className={styles.page}>
        <h1>Audit log</h1>
        <div className={`mono-label ${styles.subtitle}`}>Every detection, assignment, review, and note, across all flagged items</div>

        <Card padded={false}>
          {loading ? (
            <div className={styles.loading}>Loading…</div>
          ) : (
            <div className={styles.feed}>
              {entries.map((entry, i) => (
                <div key={i} className={styles.entry}>
                  <div>
                    <div className={styles.description}>{entry.description}</div>
                    <div className={`mono-label ${styles.meta}`}>{formatDateLong(entry.at)} · {entry.program_name}</div>
                  </div>
                  <Link to={`/flagged-items/${entry.flagged_item_id}`} className={styles.ref}>{entry.patient_ref}</Link>
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>
    </>
  );
}
