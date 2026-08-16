import { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { TopBar } from '../components/layout/TopBar';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { BulkActionBar } from '../components/ui/BulkActionBar';
import { PaginationFooter } from '../components/ui/PaginationFooter';
import { FlaggedItemsTable } from '../components/domain/FlaggedItemsTable';
import { FilterBar } from '../components/domain/FilterBar';
import { useFlaggedItems } from '../hooks/useFlaggedItems';
import { usePrograms } from '../hooks/usePrograms';
import { reviewFlaggedItem } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { formatCurrency, formatNumber } from '../utils/formatters';
import styles from './FlaggedItemsPage.module.css';

const EMPTY_FILTERS = { program: '', status: '', assignee: '', minValue: '', days: '', deadlineDays: '' };

function filtersFromSearch(searchParams, presetStatus) {
  return {
    program: searchParams.get('program') || '',
    status: presetStatus || searchParams.get('status') || '',
    assignee: searchParams.get('assignee') || '',
    minValue: searchParams.get('minValue') || '',
    days: searchParams.get('days') || '',
    deadlineDays: searchParams.get('deadlineDays') || '',
  };
}

export function FlaggedItemsPage({ presetStatus, breadcrumbSuffix = 'Assigned to me' }) {
  const { user } = useAuth();
  const [searchParams] = useSearchParams();
  const { programs } = usePrograms();

  const [filters, setFilters] = useState(() => filtersFromSearch(searchParams, presetStatus));
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [sort, setSort] = useState({ key: 'created_at', order: 'desc' });
  const [selectedIds, setSelectedIds] = useState(new Set());

  useEffect(() => {
    setFilters(filtersFromSearch(searchParams, presetStatus));
    setPage(1);
    setSelectedIds(new Set());
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams.toString(), presetStatus]);

  const { items, total, openCount, openValue, loading, refetch } = useFlaggedItems({
    ...filters,
    sort: sort.key,
    order: sort.order,
    page,
    pageSize,
  });

  function updateFilter(key, value) {
    setPage(1);
    setSelectedIds(new Set());
    setFilters((prev) => ({ ...prev, [key]: value }));
  }

  function clearFilters() {
    setFilters({ ...EMPTY_FILTERS, status: presetStatus || '' });
    setPage(1);
  }

  function toggleSelect(id) {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  }

  function toggleSelectAll() {
    setSelectedIds((prev) => (prev.size === items.length ? new Set() : new Set(items.map((it) => it.id))));
  }

  function handleSort(key) {
    setSort((prev) => (prev.key === key ? { key, order: prev.order === 'asc' ? 'desc' : 'asc' } : { key, order: 'desc' }));
  }

  const selectedValue = useMemo(
    () => items.filter((it) => selectedIds.has(it.id)).reduce((sum, it) => sum + Number(it.estimated_dollar_value), 0),
    [items, selectedIds]
  );

  async function handleBulkAction(action) {
    // reviewer is derived server-side from the authenticated session.
    await Promise.all([...selectedIds].map((id) => reviewFlaggedItem(id, { action })));
    setSelectedIds(new Set());
    refetch();
  }

  return (
    <>
      <TopBar breadcrumb={['Flagged items', breadcrumbSuffix]}>
        <input className={styles.search} placeholder="Patient ref or code" />
      </TopBar>

      <div className={styles.page}>
        <div className={styles.headerRow}>
          <div>
            <h1>Flagged items</h1>
            <div className={`mono-label ${styles.subtitle}`}>
              {formatNumber(total)} matching · {formatNumber(openCount)} open · {formatCurrency(openValue)} estimated unrealized value
            </div>
          </div>
          <div className={styles.headerActions}>
            <Button variant="secondary">Export CSV</Button>
            <Button variant="secondary">Save as view</Button>
          </div>
        </div>

        <FilterBar programs={programs} filters={filters} onChange={updateFilter} onClear={clearFilters} />

        <Card padded={false}>
          {loading ? <div className={styles.loading}>Loading…</div> : (
            <FlaggedItemsTable
              items={items}
              variant="queue"
              selectedIds={selectedIds}
              onToggleSelect={toggleSelect}
              onToggleSelectAll={toggleSelectAll}
              sortKey={sort.key}
              sortOrder={sort.order}
              onSort={handleSort}
            />
          )}
          <PaginationFooter
            total={total}
            page={page}
            pageSize={pageSize}
            onPageChange={setPage}
            onPageSizeChange={(size) => { setPageSize(size); setPage(1); }}
          />
        </Card>
      </div>

      <BulkActionBar
        selectedCount={selectedIds.size}
        selectedValue={selectedValue}
        currentUser={user?.full_name}
        onApprove={() => handleBulkAction('submitted')}
        onAssign={() => {}}
        onReject={() => handleBulkAction('rejected')}
        onClear={() => setSelectedIds(new Set())}
      />
    </>
  );
}
