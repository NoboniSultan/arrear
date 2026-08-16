import { useState } from 'react';
import { Link } from 'react-router-dom';
import { TopBar } from '../components/layout/TopBar';
import { StatCard } from '../components/ui/StatCard';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { RecoveryTrendChart } from '../components/domain/RecoveryTrendChart';
import { RecoveredByProgramList } from '../components/domain/RecoveredByProgramList';
import { FlaggedItemsTable } from '../components/domain/FlaggedItemsTable';
import { useSummary } from '../hooks/useSummary';
import { useFlaggedItems } from '../hooks/useFlaggedItems';
import { useAuth } from '../context/AuthContext';
import { formatCurrency, formatNumber, formatPercent, formatDateLong } from '../utils/formatters';
import styles from './OverviewPage.module.css';

export function OverviewPage() {
  const { user } = useAuth();
  const [scope, setScope] = useState('oversight');
  const { summary, loading } = useSummary();
  const { items: oldestFlags } = useFlaggedItems({
    status: 'new,reviewed',
    sort: 'created_at',
    order: 'asc',
    pageSize: 5,
    assignee: scope === 'mine' ? user?.full_name : undefined,
  });

  if (loading || !summary) {
    return (
      <>
        <TopBar breadcrumb={['Overview']} />
        <div className={styles.page}>Loading…</div>
      </>
    );
  }

  const { flaggedItemsOpen, recoveredPeriodToDate, awaitingSubmission } = summary;

  return (
    <>
      <TopBar breadcrumb={['Overview']}>
        <div className={styles.tabs}>
          <button className={`${styles.tab} ${scope === 'oversight' ? styles.tabActive : ''}`} onClick={() => setScope('oversight')}>Oversight</button>
          <button className={`${styles.tab} ${scope === 'mine' ? styles.tabActive : ''}`} onClick={() => setScope('mine')}>My queue</button>
        </div>
        <input className={styles.search} placeholder="Patient ref or code" />
      </TopBar>

      <div className={styles.page}>
        <div className={styles.headerRow}>
          <div>
            <h1>Recovery overview</h1>
            <div className={`mono-label ${styles.subtitle}`}>
              {formatDateLong(summary.quarterStartDate)} – {formatDateLong(summary.asOfDate)} · {summary.activeProgramCount} of {summary.totalProgramCount} programs active
            </div>
          </div>
          <div className={styles.headerActions}>
            <Button variant="secondary">Quarter to date ▾</Button>
            <Button variant="secondary">Export CSV</Button>
          </div>
        </div>

        <div className={styles.statsRow}>
          <StatCard label="Flagged items open" value={formatNumber(flaggedItemsOpen.total)}>
            <span className={styles.swatchLabel}><span className={styles.swatchFilled} />{formatNumber(flaggedItemsOpen.new)} new</span>
            <span className={styles.swatchLabel}><span className={styles.swatchOutline} />{formatNumber(flaggedItemsOpen.reviewed)} reviewed</span>
          </StatCard>

          <StatCard label="Recovered, period to date" value={formatCurrency(recoveredPeriodToDate.total)}>
            {recoveredPeriodToDate.pctChangeVsPrior !== null && (
              <span className={styles.positive}>▲ {formatPercent(recoveredPeriodToDate.pctChangeVsPrior)} vs prior</span>
            )}
            <span>{formatNumber(recoveredPeriodToDate.itemsSubmittedTotal)} items submitted</span>
          </StatCard>

          <StatCard label="Awaiting submission" value={formatCurrency(awaitingSubmission.total)}>
            <span>{formatNumber(awaitingSubmission.itemsReviewedCount)} items reviewed</span>
            {awaitingSubmission.nearestDeadlineDays !== null && (
              <span className={styles.deadline}>
                Nearest close {awaitingSubmission.nearestDeadlineDays < 0 ? 'overdue' : `in ${awaitingSubmission.nearestDeadlineDays} days`}
              </span>
            )}
          </StatCard>
        </div>

        <div className={styles.mainGrid}>
          <Card>
            <RecoveryTrendChart data={summary.monthlyTrend} />
          </Card>
          <Card>
            <RecoveredByProgramList programs={summary.recoveredByProgram} />
          </Card>
        </div>

        <Card padded={false}>
          <div className={styles.tableHeader}>
            <span className="mono-label">Oldest unworked flags</span>
            <Link to="/flagged-items" className={styles.openQueue}>Open full queue →</Link>
          </div>
          <FlaggedItemsTable items={oldestFlags} variant="compact" />
        </Card>
      </div>
    </>
  );
}
