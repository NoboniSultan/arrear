import { Card } from '../ui/Card';
import { DataTable } from '../ui/DataTable';
import styles from './CriteriaChecklist.module.css';

export function CriteriaChecklist({ criteria }) {
  const metCount = criteria.filter((c) => c.met).length;

  const columns = [
    {
      key: 'met',
      label: '',
      render: (row) => <input type="checkbox" checked={row.met} readOnly aria-label={`${row.criterion} met`} />,
    },
    { key: 'criterion', label: 'Criterion', render: (row) => <span className={styles.criterion}>{row.criterion}</span> },
    { key: 'evidence_found', label: 'Evidence found', render: (row) => row.evidence_found },
    { key: 'source_label', label: 'Source', render: (row) => <span className={styles.source}>{row.source_label}</span> },
  ];

  return (
    <Card padded={false}>
      <div className={styles.header}>
        <span className="mono-label">Criteria that triggered the flag</span>
        <span className="mono-label">{metCount} of {criteria.length} met</span>
      </div>
      <DataTable columns={columns} rows={criteria} rowKey={(row) => row.id} />
    </Card>
  );
}
