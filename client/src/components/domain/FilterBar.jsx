import { useEffect, useRef, useState } from 'react';
import styles from './FilterBar.module.css';

const STATUS_OPTIONS = ['new', 'reviewed', 'submitted', 'rejected'];
const STATUS_LABELS = { new: 'New', reviewed: 'Reviewed', submitted: 'Submitted', rejected: 'Rejected' };
const DATE_OPTIONS = [
  { label: 'All time', value: '' },
  { label: 'Last 7 days', value: '7' },
  { label: 'Last 30 days', value: '30' },
  { label: 'Last 45 days', value: '45' },
  { label: 'Last 90 days', value: '90' },
];
const ASSIGNEE_OPTIONS = ['M. Reyes', 'J. Whitcombe', 'D. Marsh'];

function StatusFilterDropdown({ value, onChange }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);
  const selected = value ? value.split(',').filter(Boolean) : [];

  useEffect(() => {
    function handleClick(e) {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  function toggle(status) {
    const next = selected.includes(status) ? selected.filter((s) => s !== status) : [...selected, status];
    onChange(next.join(','));
  }

  return (
    <div className={styles.dropdownWrapper} ref={ref}>
      <button type="button" className={styles.select} onClick={() => setOpen((o) => !o)}>
        <span>{selected.length ? selected.map((s) => STATUS_LABELS[s]).join(', ') : 'All statuses'}</span>
        {selected.length > 0 && <span className={styles.countBadge}>{selected.length}</span>}
      </button>
      {open && (
        <div className={styles.dropdownPanel}>
          {STATUS_OPTIONS.map((status) => (
            <label key={status} className={styles.checkboxRow}>
              <input type="checkbox" checked={selected.includes(status)} onChange={() => toggle(status)} />
              {STATUS_LABELS[status]}
            </label>
          ))}
        </div>
      )}
    </div>
  );
}

export function FilterBar({ programs, filters, onChange, onClear }) {
  return (
    <div className={styles.filterRow}>
      <div className={styles.field}>
        <span className="mono-label">Program</span>
        <select className={styles.select} value={filters.program} onChange={(e) => onChange('program', e.target.value)}>
          <option value="">All programs</option>
          {programs.map((p) => (
            <option key={p.id} value={p.name}>{p.full_name || p.name}</option>
          ))}
        </select>
      </div>

      <div className={styles.field}>
        <span className="mono-label">Status</span>
        <StatusFilterDropdown value={filters.status} onChange={(v) => onChange('status', v)} />
      </div>

      <div className={styles.field}>
        <span className="mono-label">Date flagged</span>
        <select className={styles.select} value={filters.days} onChange={(e) => onChange('days', e.target.value)}>
          {DATE_OPTIONS.map((opt) => (
            <option key={opt.label} value={opt.value}>{opt.label}</option>
          ))}
        </select>
      </div>

      <div className={styles.field}>
        <span className="mono-label">Min. est. value</span>
        <div className={styles.currencyInput}>
          <span>$</span>
          <input
            type="number"
            min="0"
            value={filters.minValue}
            onChange={(e) => onChange('minValue', e.target.value)}
          />
        </div>
      </div>

      <div className={styles.field}>
        <span className="mono-label">Assignee</span>
        <select className={styles.select} value={filters.assignee} onChange={(e) => onChange('assignee', e.target.value)}>
          <option value="">All assignees</option>
          <option value="unassigned">Unassigned</option>
          {ASSIGNEE_OPTIONS.map((name) => (
            <option key={name} value={name}>{name}</option>
          ))}
        </select>
      </div>

      <button type="button" className={styles.clear} onClick={onClear}>Clear filters</button>
    </div>
  );
}
