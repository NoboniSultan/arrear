import { useNavigate } from 'react-router-dom';
import { DataTable } from '../ui/DataTable';
import { Badge } from '../ui/Badge';
import { formatCurrency, formatDateLong, daysAgo } from '../../utils/formatters';
import styles from './FlaggedItemsTable.module.css';

// variant 'queue' (Flagged Items page): checkboxes, status badge, chevron.
// variant 'compact' (Overview's oldest-unworked table): age + assignee instead.
export function FlaggedItemsTable({
  items,
  variant = 'queue',
  selectedIds,
  onToggleSelect,
  onToggleSelectAll,
  sortKey,
  sortOrder,
  onSort,
}) {
  const navigate = useNavigate();
  const allSelected = variant === 'queue' && items.length > 0 && items.every((it) => selectedIds?.has(it.id));

  const columns = [];

  if (variant === 'queue') {
    columns.push({
      key: 'select',
      label: <input type="checkbox" checked={allSelected} onChange={onToggleSelectAll} aria-label="Select all rows" />,
      render: (row) => (
        <input
          type="checkbox"
          checked={selectedIds?.has(row.id) || false}
          onChange={() => onToggleSelect(row.id)}
          onClick={(e) => e.stopPropagation()}
          aria-label={`Select ${row.patient_ref}`}
        />
      ),
    });
  }

  columns.push(
    { key: 'patient_ref', label: 'Patient ref', render: (row) => <span className="mono-label">{row.patient_ref}</span> },
    { key: 'program', label: 'Program', render: (row) => <span className="mono-label">{row.program_name}</span> },
    {
      key: 'criteria_matched',
      label: 'Triggering criteria',
      render: (row) => <span className={styles.criteria}>{row.criteria_matched}</span>,
    },
    {
      key: 'estimated_dollar_value',
      label: 'Est. value',
      align: 'right',
      sortable: variant === 'queue',
      render: (row) => <span className={`tabular-nums ${styles.value}`}>{formatCurrency(row.estimated_dollar_value)}</span>,
    }
  );

  if (variant === 'queue') {
    columns.push(
      { key: 'status', label: 'Status', render: (row) => <Badge status={row.status} /> },
      { key: 'created_at', label: 'Date flagged', render: (row) => <span className="mono-label">{formatDateLong(row.created_at)}</span> },
      { key: 'chevron', label: '', render: () => <span className={styles.chevron}>›</span> }
    );
  } else {
    columns.push(
      { key: 'age', label: 'Age', align: 'right', render: (row) => <span className="mono-label tabular-nums">{daysAgo(row.created_at)} D</span> },
      {
        key: 'assignee',
        label: 'Assigned',
        render: (row) => (row.assignee ? <span>{row.assignee}</span> : <span className={styles.unassigned}>Unassigned</span>),
      }
    );
  }

  return (
    <DataTable
      columns={columns}
      rows={items}
      rowKey={(row) => row.id}
      sortKey={sortKey}
      sortOrder={sortOrder}
      onSort={onSort}
      onRowClick={(row) => navigate(`/flagged-items/${row.id}`)}
      rowClassName={(row) => (variant === 'queue' && selectedIds?.has(row.id) ? styles.selectedRow : '')}
    />
  );
}
