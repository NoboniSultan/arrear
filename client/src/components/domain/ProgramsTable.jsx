import { Link } from 'react-router-dom';
import { DataTable } from '../ui/DataTable';
import { formatCurrency, formatNumber, formatDateLong } from '../../utils/formatters';
import styles from './ProgramsTable.module.css';

export function ProgramsTable({ programs, onActivate }) {
  const columns = [
    {
      key: 'program',
      label: 'Program',
      render: (p) => (
        <div>
          <div className={styles.code}>{p.name}</div>
          <div className={styles.fullName}>{p.full_name}</div>
        </div>
      ),
    },
    {
      key: 'status',
      label: 'Status',
      render: (p) => <span className={p.status === 'active' ? styles.activeBadge : styles.pausedBadge}>{p.status}</span>,
    },
    { key: 'rules_version', label: 'Rule set', render: (p) => <span className="mono-label">v{p.rules_version}</span> },
    {
      key: 'last_updated',
      label: 'Last updated',
      render: (p) => (
        <div>
          <div>{formatDateLong(p.last_updated)}</div>
          {p.changelog[0] && <div className={styles.changeNote}>{p.changelog[0].description}</div>}
        </div>
      ),
    },
    { key: 'flagsThisQuarter', label: 'Flags, period', align: 'right', render: (p) => <span className="tabular-nums">{formatNumber(p.flagsThisQuarter)}</span> },
    { key: 'recoveredThisQuarter', label: 'Recovered', align: 'right', render: (p) => <span className={`tabular-nums ${styles.recovered}`}>{formatCurrency(p.recoveredThisQuarter)}</span> },
    {
      key: 'action',
      label: '',
      render: (p) =>
        p.status === 'paused' ? (
          <button type="button" className={styles.actionLink} onClick={() => onActivate(p.id)}>Activate</button>
        ) : (
          <Link to={`/programs/${p.id}/rules`} className={styles.actionLink}>Edit rules</Link>
        ),
    },
  ];

  return <DataTable columns={columns} rows={programs} rowKey={(p) => p.id} rowClassName={(p) => (p.status === 'paused' ? styles.pausedRow : '')} />;
}
